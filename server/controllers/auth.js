import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { createError } from "../error.js";
import jwt from "jsonwebtoken";
import Balance from "../models/Balance.js";
import Owner from '../models/Owner.js';  // Import the Owner model



export const signup = async (req, res, next) => {
  try {
    // Hash the password
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(req.body.password, salt);

    // Create a new user
    const newUser = new User({ ...req.body, password: hash });

    // Save the user
    await newUser.save();

    // Check if the user's email matches the Admin_Mails
    const adminEmail = "salahfdasalahfda.11166@gmail.com"; // Use your actual Admin_Mails value

    if (req.body.email === adminEmail) {
      // If it's an admin email, create an owner account
      const newOwner = new Owner({
        name: req.body.name,     // Add the name from the user to the Owner model
        email: req.body.email,   // Add the email from the user to the Owner model
        password: hash,          // Use the hashed password
      });
      await newOwner.save();
    }

    // Create a balance document for the user
    await Balance.create({ user: newUser._id, coins: 35 });

    // Send a success response
    res.status(200).send("User has been created!");
  } catch (err) {
    // Handle errors
    next(err);
  }
};









export const signin = async (req, res, next) => {
  try {
    const user = await User.findOne({ name: req.body.name });
    if (!user) {
      return next(createError(404, "Username or Password is incorrect!"));
    }

    const isCorrect = await bcrypt.compare(req.body.password, user.password);
    if (!isCorrect) {
      return next(createError(400, "Username or Password is incorrect!"));
    }

    // Include the user's name in the JWT payload
    const token = jwt.sign({ id: user._id, name: user.name }, process.env.JWT);

    // Omit the password field from the response
    const { password, ...others } = user._doc;

    // Set the JWT token as a cookie named 'access_token'
    res.cookie("access_token", token, { httpOnly: true });

    // Send the user data in the response
    res.status(200).json(others);
  } catch (err) {
    next(err);
  }
};


export const googleAuth = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      const token = jwt.sign({ id: user._id }, process.env.JWT);
      res
        .cookie("access_token", token, {
          httpOnly: true,
        })
        .status(200)
        .json(user._doc);
    } else {
      const newUser = new User({
        ...req.body,
        fromGoogle: true,
      });
      const savedUser = await newUser.save();
      const token = jwt.sign({ id: savedUser._id }, process.env.JWT);
      res
        .cookie("access_token", token, {
          httpOnly: true,
        })
        .status(200)
        .json(savedUser._doc);
    }
  } catch (err) {
    next(err);
  }
};
