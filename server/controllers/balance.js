// controllers/balanceController.js
import mongoose from 'mongoose'; // Import mongoose
import { createError } from "../error.js";
import Balance from '../models/Balance.js';
import { createSystemNotificationForUser } from './notification.js';
import User from '../models/User.js';



export const getBalance = async (req, res, next) => {
  try {
    const userId = req.user.id; // Fetch user ID from req.user

    // Validate input data
    if (!userId) {
      throw createError(400, 'User ID is missing.');
    }

    // Retrieve user's balance
    const balance = await Balance.findOne({ user: userId });

    // Example of sending a notification
    const notificationMessage = `Your current balance is ${balance ? balance.currentCoins : 0} coins.`;
    await createSystemNotificationForUser('system', userId, notificationMessage);

    res.status(200).json({ success: true, balance: balance ? balance.currentCoins : 0 });
  } catch (error) {
    console.error('Error getting balance:', error);
    // Use your custom error handler
    next(error);
  }
};



export const deductCoins = async (req, res, next) => {
  try {
    const { userId } = req.body;

    // Validate input data
    if (!userId) {
      throw createError(400, 'Missing required parameters.');
    }

    // Retrieve user's balance
    const balance = await Balance.findOne({ user: userId });

    // Check if user has sufficient coins
    if (!balance || balance.currentCoins < 10) {
      throw createError(400, 'Insufficient coins.');
    }

    // Generate a random deduction amount between 10 and 15
    const randomDeduction = Math.floor(Math.random() * (15 - 10 + 1) + 10);

    // Deduct random amount and save the updated balance
    balance.currentCoins -= randomDeduction;
    await balance.save();

    const notificationMessage = `Deducted a random amount of ${randomDeduction} coins from your account. Your current balance is ${balance.currentCoins} coins.`;
    await createSystemNotificationForUser(userId, notificationMessage);
    

    res.status(200).json({ success: true, message: 'Coins deducted successfully.', balance: balance.currentCoins });
  } catch (error) {
    console.error('Error deducting coins:', error);
    // Use your custom error handler
    next(error);
  }
};






export const addCoins = async (userId, amount) => {
  try {
    // Validate input data
    if (!userId || amount === undefined || amount <= 0) {
      throw createError(400, 'Invalid amount to add.');
    }

    // Retrieve user's balance
    const balance = await Balance.findOne({ user: userId });

    // If the user doesn't have a balance, create a new balance record
    if (!balance) {
      const newBalance = await Balance.create({
        user: userId,
        currentCoins: amount,
      });

      return newBalance.currentCoins;
    }

    // Add coins and save the updated balance
    balance.currentCoins += amount;
    await balance.save();

    return balance.currentCoins;
  } catch (error) {
    console.error('Error adding coins to balance:', error);
    throw error;
  }
};










export const bonusCoins = async (req, res, next) => {
  try {
    const { userId } = req.body;

    // Validate input data
    if (!userId) {
      throw createError(400, 'Missing required parameters.');
    }

    // Retrieve user's balance
    let balance = await Balance.findOne({ user: userId });

    if (!balance) {
      // Create balance if it doesn't exist
      balance = await Balance.create({ user: userId, currentCoins: 0 });
    }

    // Generate a random bonus between 5 and 30
    const randomBonus = Math.floor(Math.random() * (30 - 5 + 1) + 5);

    // Add random bonus coins to the current balance
    balance.currentCoins += randomBonus;
    await balance.save();
    const notificationMessage = `You received a random bonus of ${randomBonus} coins. Your current balance is ${balance.currentCoins} coins.`;
    await createSystemNotificationForUser(userId, notificationMessage);
    
    res.status(200).json({ success: true, message: 'Random bonus added successfully.', balance: balance.currentCoins });
  } catch (error) {
    console.error('Error giving random bonus:', error);
    // Use your custom error handler
    next(error);
  }
};






export const deductCoinsNew = async (userId, userId2, amount, res, next) => {
  try {
    // Validate input data
    if (!userId || !userId2) {
      throw createError(400, 'Missing required parameters.');
    }

    // Retrieve user's balance
    const balance = await Balance.findOne({ user: userId });
    const balance2 = await Balance.findOne({ user: userId2 });

    // Generate a random deduction amount between 10 and 15
    const randomDeduction = amount;
    const randomBonus = amount;

    // Deduct random amount and save the updated balance
    balance.currentCoins -= randomDeduction;
    await balance.save();

    // Add bonus to the second user's balance and save the updated balance
    balance2.currentCoins += randomBonus;
    await balance2.save();

    const notificationMessage = `Deducted a random amount of ${randomDeduction} coins from your account. Your current balance is ${balance.currentCoins} coins.`;
    await createSystemNotificationForUser(userId, notificationMessage);

    const notificationMessage2 = `You received a bonus of ${randomBonus} coins. Your current balance is ${balance2.currentCoins} coins.`;
    await createSystemNotificationForUser(userId2, notificationMessage2);

    res.status(200).json({ success: true, message: 'Coins deducted successfully.', balance: balance.currentCoins });
  } catch (error) {
    console.error('Error deducting coins:', error);
    // Use your custom error handler
    next(error);
  }
};
