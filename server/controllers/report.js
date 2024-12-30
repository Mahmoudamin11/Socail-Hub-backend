import { exec } from 'child_process';
import User from '../models/User.js';
import Balance from '../models/Balance.js';
import Comment from '../models/Comment.js';
import Message from '../models/Message.js';
import PremiumPlan from '../models/premiumPlanModel.js';
import { createSystemNotificationForUser } from './notification.js';
import mongoose from 'mongoose';
import Report from '../models/Report.js'; // Assuming you have created the Report model

// Function to get user by name
const getUserByName = async (name) => {
  return await User.findOne({ name });
};

// Function to deduct coins from the user's balance
const deductCoins = async (userId, amount) => {
  try {
    const userBalance = await Balance.findOne({ user: userId });
    if (!userBalance) {
      throw new Error('User balance not found');
    }
    userBalance.currentCoins -= amount;
    await userBalance.save();
    return userBalance.currentCoins;
  } catch (error) {
    throw error;
  }
};

// Function to get daily report limit based on premium plan
const getDailyReportLimit = async (userId) => {
  const premiumPlan = await PremiumPlan.findOne({ user: userId });
  if (!premiumPlan) {
    return 1; // Default limit for non-premium users
  }

  switch (premiumPlan.planType) {
    case 'business':
      return 2;
    case 'vip':
    case 'superVIP':
      return 3;
    default:
      return 1;
  }
};

// Function to calculate remaining time until reset
const getTimeUntilReset = () => {
  const now = new Date();
  const resetTime = new Date(now);
  resetTime.setDate(now.getDate() + 1);
  resetTime.setHours(0, 0, 0, 0);

  const diff = resetTime - now;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { hours, minutes };
};

export const report = async (req, res, next) => {
  try {
    const pythonScriptPath = "C:\\Users\\PC\\Desktop\\ChatTube\\CommentToxicity-main\\Main.py";
    const sexualWordsPath = "C:\\Users\\PC\\Desktop\\ChatTube\\CommentToxicity-main\\Sexual_Words.txt";
    const violenceWordsPath = "C:\\Users\\PC\\Desktop\\ChatTube\\CommentToxicity-main\\Vaulance_Words.txt";
    const threatWordsPath = "C:\\Users\\PC\\Desktop\\ChatTube\\CommentToxicity-main\\Threaten_Words.txt";

    const { input_sentence, user_name, message_type } = req.body;

    // Fetch the user by name
    const user = await getUserByName(user_name);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent user from reporting their own content
    if (req.user.id === user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You cannot report yourself.' });
    }

    // Fetch report limit based on the user's subscription
    const reportLimit = await getDailyReportLimit(req.user.id);
    const today = new Date().toISOString().split('T')[0];

    // Track daily report usage
    const userRecord = await User.findById(req.user.id);
    if (!userRecord.dailyReports) userRecord.dailyReports = {};

    const todayReports = userRecord.dailyReports[today] || 0;

    if (todayReports >= reportLimit) {
      const { hours, minutes } = getTimeUntilReset();
      return res.status(429).json({
        success: false,
        message: `You have reached your daily report limit of ${reportLimit} reports. You can report again in ${hours} hours and ${minutes} minutes.`,
      });
    }

    // Increment report usage
    userRecord.dailyReports[today] = todayReports + 1;
    await userRecord.save();

    let isMessageFound = false;

    // Check messages
    if (message_type === 'message') {
      const messages = await Message.find({
        senderId: user._id,
        content: { $regex: `^${input_sentence.trim()}$`, $options: 'i' },
      });
      if (messages.length > 0) {
        isMessageFound = true;
        await Message.deleteMany({ senderId: user._id, content: { $regex: `^${input_sentence.trim()}$`, $options: 'i' } });
      }
    }

    // Check comments
    if (message_type === 'comment' && !isMessageFound) {
      const comments = await Comment.find({
        userId: user._id,
        desc: { $regex: `^${input_sentence.trim()}$`, $options: 'i' },
      });
      if (comments.length > 0) {
        isMessageFound = true;
        await Comment.deleteMany({ userId: user._id, desc: { $regex: `^${input_sentence.trim()}$`, $options: 'i' } });
      }
    }

    if (!isMessageFound) {
      const { hours, minutes } = getTimeUntilReset();
      return res.status(400).json({
        success: false,
        message: `Message or comment not found. You can try again in ${hours} hours and ${minutes} minutes.`,
      });
    }

    console.log("Executing Python script...");
    exec(
      `python "${pythonScriptPath}" "${sexualWordsPath}" "${violenceWordsPath}" "${threatWordsPath}" "${input_sentence}"`,
      async (error, stdout, stderr) => {
        if (error) {
          console.error('Error processing report:', error);
          return res.status(500).json({ success: false, message: 'Error processing report' });
        }

        const results = JSON.parse(stdout);
        let deduction = 0;

        results.forEach((result) => {
          if (result[1] === 'Sexual') deduction += 300;
          if (result[1] === 'Violence' || result[1] === 'Threat') deduction += 150;
        });

        // Save the report in the database
const newReport = new Report({
  user: req.user.id,
  reportedUser: user._id,
  content: input_sentence,
  contentType: message_type,
  reason: results.map((result) => result[1]).join(', '), // Combine all reasons
  status: deduction > 0 ? 'reviewed' : 'pending',
});

        await newReport.save();

        if (deduction > 0) {
          deductCoins(user._id, deduction);
          createSystemNotificationForUser(
            user._id,
            `Your content was flagged as inappropriate. ${deduction} coins were deducted.`
          );
        }

        return res.status(200).json({ success: true, results, deduction });
      }
    );
  } catch (error) {
    console.error('Error processing report:', error);
    return res.status(500).json({ success: false, message: 'Error processing report' });
  }
};


export const getUserHistory = async (req, res, next) => {
  try {
    const { day, month, year } = req.body;

    // Extract user ID from token (set by verifyToken middleware)
    const userId = req.user?.id;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error("Invalid user ID:", userId);
      return res.status(400).json({ success: false, status: 400, message: "Invalid user ID format!" });
    }

    // Validate if day, month, and year are provided
    if (!day || !month || !year) {
      return res.status(400).json({ success: false, message: "Day, month, and year are required!" });
    }

    // Construct the date range for the query
    const startDate = new Date(year, month - 1, day, 0, 0, 0); // Start of the day
    const endDate = new Date(year, month - 1, day, 23, 59, 59); // End of the day

    // Fetch user history within the date range
    const history = await History.find({
      user: userId,
      createdAt: { $gte: startDate, $lte: endDate },
    });

    if (!history.length) {
      return res.status(404).json({ success: false, message: "No history found for this user on the specified date!" });
    }

    res.status(200).json({ success: true, history });
  } catch (error) {
    console.error("Error fetching user history:", error.message);
    next(error);
  }
};
