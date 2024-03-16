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

    // Deduct required coins and save the updated balance
    balance.currentCoins -= requiredCoins;
    await balance.save();
  } catch (error) {
    console.error('Error deducting coins for premium plan:', error);
    throw error;
  }
};




// Function to subscribe to a premium plan
export const subscribePremiumPlan = async (req, res) => {
  try {
    const { planType } = req.body;
    const userId = req.user.id;
    
    // Validate input data
    if (!userId || !planType) {
      throw createError(400, 'Missing required parameters.');
    }

    // Check if user is already subscribed to a premium plan
    const existingSubscription = await PremiumPlan.findOne({ user: userId });

    if (existingSubscription) {
      return res.status(400).json({ success: false, message: 'You are already subscribed to a premium plan.' });
    }

    // Set expiration date 7 days from now
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);

    // Save premium plan subscription
    const premiumPlan = await PremiumPlan.create({
      user: userId,
      planType,
      expirationDate,
    });

    res.status(200).json({ success: true, message: 'Subscription successful.', premiumPlan });

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
      console.log('No expired subscriptions found.');
    }
  } catch (error) {
    console.error('Error checking and removing expired subscriptions:', error);
  }
};

// Schedule the check to occur every 5 seconds
cron.schedule('*/5 * * * * *', checkAndRemoveExpiredSubscriptions);








const getRequiredCoinsForPlan = (planType) => {
  switch (planType) {
    case 'business':
      return 3500;
    case 'vip':
      return 5000;
    case 'superVIP':
      return 7500;
    default:
      throw createError(400, 'Invalid plan type.');
  }
};








// Function to retrieve premium plan type by user ID
const getPremiumPlanType = async (userId) => {
  try {
    const userPremiumPlan = await PremiumPlan.findOne({ user: userId });
    return userPremiumPlan ? userPremiumPlan.planType : null;
  } catch (error) {
    console.error('Error retrieving premium plan type:', error);
    throw error;
  }
};







// Function to collect statistics and grant coins
export const collectStatisticsAndGrantCoins = async (req, res) => {
  try {
    const userId = req.user.id; // Extract userId from req.user

    // Check if user has already performed statistics collection for the day
    const today = new Date();
    const statisticsRecord = await Statistics.findOne({ userId, date: { $gte: today.setHours(0, 0, 0, 0) } });

    if (statisticsRecord) {
      return res.status(400).json({ success: false, message: 'Statistics already collected for today.' });
    }

    // Get the count of unliked and undisliked posts and videos
    const [postCount, videoCount, commentCount] = await Promise.all([
      Post.countDocuments({ $and: [{ likes: { $ne: userId } }, { dislikes: { $ne: userId } }] }),
      Video.countDocuments({ $and: [{ likes: { $ne: userId } }, { dislikes: { $ne: userId } }] }),
      Comment.countDocuments({ user: userId })
    ]);
    
    // Get premium plan type for the user
    const premiumPlanType = await getPremiumPlanType(userId);

    // If premium plan type is not recognized, throw an error
    if (!['business', 'vip', 'superVIP'].includes(premiumPlanType)) {
      throw new Error('Must subscribe to a premium plan first.');
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
    await Statistics.create({ userId, date: today });

    // Return the number of coins granted
    res.status(200).json({ success: true, coinsGranted });
  } catch (error) {
    console.error('Error collecting statistics and granting coins:', error);
    res.status(error.status || 500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};
