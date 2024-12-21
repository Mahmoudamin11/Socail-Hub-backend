// controllers/balanceController.js
import mongoose from 'mongoose';
import { createError } from "../error.js";
import Balance from '../models/Balance.js';
import PremiumPlan from '../models/premiumPlanModel.js'; // Assuming you have a PremiumPlan model
import { createSystemNotificationForUser } from './notification.js'; // Adjust the path accordingly
import { addCoins } from './balance.js'; // Import the addCoins function
import Post from "../models/Post.js";
import Video from "../models/Video.js";
import Comment from "../models/Comment.js";
import Statistics from '../models/Statistics.js'; // Import the Statistics model
import cron from 'node-cron'; // Import node-cron for scheduling
import User from '../models/User.js';
import { createNotificationForUser } from './notification.js';
import { addHistory } from '../controllers/historyController.js'; // Import the function to add history entries




export const deductCoinsForPremiumPlan = async (userId, requiredCoins) => {
  try {
    // Validate input data
    if (!userId || requiredCoins === undefined) {
      throw createError(400, 'Missing required parameters.');
    }

    // Retrieve user's balance
    const balance = await Balance.findOne({ user: userId });

    // Check if user has sufficient coins
    if (!balance || balance.currentCoins < requiredCoins) {
      const errorMessage = `Insufficient coins. Current balance: ${balance ? balance.currentCoins : 0}, Required coins: ${requiredCoins}.`;
      throw createError(400, errorMessage);
    }
    await addHistory(req.user.id, `System Deducte   : ${requiredCoins}   From You `);

    // Deduct required coins and save the updated balance
    balance.currentCoins -= requiredCoins;
    await balance.save();
  } catch (error) {
    console.error('Error deducting coins for premium plan:', error);
    throw error;
  }
};









export const subscribePremiumPlan = async (req, res) => {
  try {
    const { planType } = req.body;
    const userId = req.user.id;

    // Retrieve user information including the name
    const userinfo = await User.findById(userId);

    // Validate input data
    if (!userId || !planType) {
      throw createError(400, 'Missing required parameters.');
    }

    // Retrieve the price of the plan
    const planPrice = getPlanPrice(planType);

    // Retrieve user's balance
    const balance = await Balance.findOne({ user: userId });

    // Check if user has sufficient coins
    if (!balance || balance.currentCoins < planPrice) {
      throw createError(400, 'Insufficient coins to subscribe to the premium plan.');
    }

    // Check if user is already subscribed to a premium plan
    const existingSubscription = await PremiumPlan.findOne({ user: userId });

    if (existingSubscription) {
      return res.status(400).json({ success: false, message: 'You are already subscribed to a premium plan.' });
    }

    // Set expiration date 7 days from now
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7); // Add 7 days

    // Deduct the price of the plan from user's balance
    balance.currentCoins -= planPrice;
    await balance.save();

    const userName = userinfo.name;

    // Save premium plan subscription
    const premiumPlan = await PremiumPlan.create({
      user: userId,
      userName,
      planType,
      expirationDate,
    });

    // Send notification to the user
    const notificationMessage = `You have successfully subscribed to the ${planType} plan. Enjoy your premium features!`;
    await createSystemNotificationForUser(userId, notificationMessage);

    // Modify the premiumPlan object to include the userName
    const premiumPlanWithUserName = { ...premiumPlan._doc, userName };
    await addHistory(req.user.id, `You Joined Into   : ${planType} plan`);

    res.status(200).json({ success: true, message: 'Subscription successful.', premiumPlan: premiumPlanWithUserName });

  } catch (error) {
    console.error('Error subscribing to premium plan:', error);
    res.status(error.status || 500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};







// Function to check and remove expired subscriptions
const checkAndRemoveExpiredSubscriptions = async () => {
  try {
    const currentDate = new Date();
    const expiredSubscriptions = await PremiumPlan.find({ expirationDate: { $lte: currentDate } });

    if (expiredSubscriptions.length > 0) {
      // Remove expired subscriptions
      await PremiumPlan.deleteMany({ expirationDate: { $lte: currentDate } });
      console.log(`${expiredSubscriptions.length} expired subscriptions removed successfully.`);
    } else {
    }
  } catch (error) {
    console.error('Error checking and removing expired subscriptions:', error);
  }
};

// Schedule the check to occur every 5 seconds
cron.schedule('*/5 * * * * *', checkAndRemoveExpiredSubscriptions);







const getPlanPrice = (planType) => {
  switch (planType) {
    case 'business':
      return 5000; // Price for business plan
    case 'vip':
      return 6500; // Price for VIP plan
    case 'superVIP':
      return 8000; // Price for superVIP plan
    default:
      throw createError(400, 'Invalid plan type.');
  }
};






export const getPremiumPlanType = async (req, res, next) => {
  try {
    // Extract userId from the request parameters
    const { userId } = req.params;

    // Fetch the premium plan for the given user ID
    const userPremiumPlan = await PremiumPlan.findOne({ user: userId });

    // Respond with the plan type or null if not found
    res.status(200).json({
      success: true,
      planType: userPremiumPlan ? userPremiumPlan.planType : null,
    });
  } catch (error) {
    console.error('Error retrieving premium plan type:', error);
    next(error); // Pass error to the error handler middleware
  }
};







// Function to fetch premium plan type for statistics
const getPremiumPlanTypeForStatistics = async (userId) => {
  try {
    // Fetch the premium plan for the given user ID
    const userPremiumPlan = await PremiumPlan.findOne({ user: userId });

    // Return the plan type or null if not found
    return userPremiumPlan ? userPremiumPlan.planType : null;
  } catch (error) {
    console.error('Error retrieving premium plan type for statistics:', error);
    throw new Error('Failed to retrieve premium plan type');
  }
};

// Function to collect statistics and grant coins
export const collectStatisticsAndGrantCoins = async (req, res) => {
  try {
    const userId = req.user.id; // Extract userId from req.user

    // Check if user has already performed statistics collection for the day
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const statisticsRecord = await Statistics.findOne({ userId, date: { $gte: startOfDay } });

    if (statisticsRecord) {
      return res.status(400).json({ success: false, message: 'Statistics already collected for today.' });
    }

    // Get the count of unliked and undisliked posts and videos
    const [postCount, videoCount, commentCount] = await Promise.all([
      Post.countDocuments({ $and: [{ likes: { $ne: userId } }, { dislikes: { $ne: userId } }] }),
      Video.countDocuments({ $and: [{ likes: { $ne: userId } }, { dislikes: { $ne: userId } }] }),
      Comment.countDocuments({ user: userId }),
    ]);

    // Get premium plan type for the user
    const premiumPlanType = await getPremiumPlanTypeForStatistics(userId);

    // If premium plan type is not recognized, throw an error
    if (!['business', 'vip', 'superVIP'].includes(premiumPlanType)) {
      return res.status(400).json({ success: false, message: 'Must subscribe to a premium plan first.' });
    }

    // Determine coins based on premium plan type
    let coinsGranted = 0;
    switch (premiumPlanType) {
      case 'business':
        coinsGranted += commentCount * 12;
        coinsGranted += postCount * 14;
        coinsGranted += videoCount * 14;
        break;
      case 'vip':
        coinsGranted += commentCount * 24;
        coinsGranted += postCount * 26;
        coinsGranted += videoCount * 26;
        break;
      case 'superVIP':
        coinsGranted += commentCount * 36;
        coinsGranted += postCount * 38;
        coinsGranted += videoCount * 38;
        break;
      default:
        throw new Error('Invalid premium plan type.');
    }

    // Grant coins to the user
    await addCoins(userId, coinsGranted);

    // Store statistics record for the day
    await Statistics.create({ userId, date: startOfDay });

    // Return the number of coins granted
    res.status(200).json({ success: true, coinsGranted });
  } catch (error) {
    console.error('Error collecting statistics and granting coins:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};





export const distributeCoins = async () => {
  try {
    // Fetch all balances
    const balances = await Balance.find();

    // Iterate through each balance and add coins based on premium plan type
    for (const balance of balances) {
      const userId = balance.user;
      const premiumPlanType = await getPremiumPlanType(userId);

      // Determine coins to be added based on premium plan type
      let coinsToAdd = 0;
      switch (premiumPlanType) {
        case 'business':
          coinsToAdd = 100;
          break;
        case 'vip':
          coinsToAdd = 150;
          break;
        case 'superVIP':
          coinsToAdd = 200;
          break;
        default:
          coinsToAdd = 85; // Default for users without premium plans
          break;
      }

      // Add coins to the balance
      balance.currentCoins += coinsToAdd;
      await balance.save();

      // Send notification to the user
      const notificationMessage = `Daily gift of ${coinsToAdd} coins has been added to your balance.`;
      await createSystemNotificationForUser(userId, notificationMessage);
      await addHistory(req.user.id, `You Recived Daily gift of ${coinsToAdd} coins has been added to your balance this Day.`);

    }

    console.log('Coins distributed successfully.');
  } catch (error) {
    console.error('Error distributing coins:', error);
    throw error;
  }
};

// Schedule to distribute coins once per day
cron.schedule('0 0 * * *', distributeCoins);






// Function to transfer coins to another user
export const transferCoins = async (req, res) => {
  try {
    const { recipientName, amount } = req.body;
    const senderId = req.user.id;

    // Validate inputs
    if (!recipientName || !amount || amount <= 0) {
      throw createError(400, 'Invalid recipient name or amount.');
    }

    // Find sender's balance
    const senderBalance = await Balance.findOne({ user: senderId });

    // Check if sender has sufficient coins
    if (!senderBalance || senderBalance.currentCoins < amount) {
      throw createError(400, 'Insufficient coins to transfer.');
    }

    // Find recipient by username
    const recipient = await User.findOne({ name: recipientName });

    // Check if recipient exists
    if (!recipient) {
      throw createError(404, 'Recipient not found.');
    }

    // Update sender's balance
    senderBalance.currentCoins -= amount;
    await senderBalance.save();

    // Find recipient's balance
    let recipientBalance = await Balance.findOne({ user: recipient._id });

    // If recipient doesn't have a balance, create one
    if (!recipientBalance) {
      recipientBalance = await Balance.create({ user: recipient._id, currentCoins: 0 });
    }

    // Update recipient's balance
    recipientBalance.currentCoins += parseInt(amount); // Convert amount to integer before adding
    await recipientBalance.save();

    // Send notification to recipient
    const notificationMessage = `You have received ${amount} coins from ${req.user.name}.`; // Construct notification message
    await createNotificationForUser(senderId, recipient._id, notificationMessage); // Send notification
    await addHistory(req.user.id, `You Send  :${amount}  To "${recipient.name}"`);

    res.status(200).json({ success: true, message: 'Coins transferred successfully.' });
  } catch (error) {
    console.error('Error transferring coins:', error);
    res.status(error.status || 500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};