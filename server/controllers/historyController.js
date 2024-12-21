// controllers/historyController.js
import History from '../models/History.js';
import mongoose from "mongoose";
import { createError } from "../error.js";

// Function to add a history entry
export const addHistory = async (userId, action) => {
  try {
    const historyEntry = await History.create({ user: userId, action });
    return historyEntry;
  } catch (error) {
    console.error('Error adding history entry:', error);
    throw error;
  }
};

export const getUserHistory = async (req, res, next) => {
  try {
    const { userId } = req.body;

    // Validate if userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return next(createError(400, "Invalid user ID format!"));
    }

    // Fetch user history
    const history = await History.find({ user: userId }).populate('user');
    if (!history.length) {
      return res.status(404).json({ message: "No history found for this user!" });
    }

    res.status(200).json({ success: true, history });
  } catch (error) {
    console.error("Error fetching user history:", error.message);
    next(error);
  }
};

// Other CRUD operations as needed
