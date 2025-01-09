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
    // Extract user ID from token (provided by verifyToken middleware)
    const userId = req.user?.id;

    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "Invalid user ID format!",
      });
    }

    // Extract date from request params
    const { day, month, year } = req.params;

    // Validate that date is provided
    if (!day || !month || !year) {
      return res.status(400).json({
        success: false,
        message: "Day, month, and year are required!",
      });
    }

    // Convert day, month, and year to numbers for constructing Date
    const parsedDay = parseInt(day, 10);
    const parsedMonth = parseInt(month, 10);
    const parsedYear = parseInt(year, 10);

    // Validate that the parsed values are valid numbers
    if (isNaN(parsedDay) || isNaN(parsedMonth) || isNaN(parsedYear)) {
      return res.status(400).json({
        success: false,
        message: "Invalid day, month, or year format!",
      });
    }

    // Construct the start and end dates for filtering
    const startDate = new Date(parsedYear, parsedMonth - 1, parsedDay, 0, 0, 0); // Start of the day
    const endDate = new Date(parsedYear, parsedMonth - 1, parsedDay, 23, 59, 59); // End of the day

    // Query the database for history entries for the user on the specified date
    const history = await History.find({
      user: userId,
      createdAt: { $gte: startDate, $lte: endDate },
    });

    // If no history is found, return a 404 response
    if (!history.length) {
      return res.status(404).json({
        success: false,
        message: "No history found for this user on the specified date!",
      });
    }

    // Return the history
    res.status(200).json({
      success: true,
      history,
    });
  } catch (error) {
    console.error("Error fetching user history:", error.message);
    next(error);
  }
};

// Other CRUD operations as needed
