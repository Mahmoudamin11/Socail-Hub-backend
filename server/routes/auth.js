import express from "express";
import { googleAuth, signin, signup,sendPasswordOTP,verifyOTPAndResetPassword } from "../controllers/auth.js";
import { verifyToken } from "../verifyToken.js";  // Ensure you only import once

const router = express.Router();

// CREATE A USER (No token required)
router.post("/signup", signup);

// SIGN IN (No token required)
router.post("/signin", signin);

// GOOGLE AUTH (No token required)
router.post("/google", googleAuth);

// SEND PASSCODE (No token required)
router.post("/send-password-otp", sendPasswordOTP);

// RESET PASSWORD (No token required)
router.post("/reset-password-with-otp", verifyOTPAndResetPassword);

// Protected routes that require authentication (add more if needed)
// For example, let's assume you want to protect the user's profile route
// This will only allow authenticated users to access it
router.get("/profile", verifyToken, (req, res) => {
  // You can access the authenticated user via req.user (set by verifyToken)
  res.status(200).json({ message: "This is a protected route.", user: req.user });
});

// You can add more routes that need protection below
// Example for updating user profile:
router.put("/update-profile", verifyToken, (req, res) => {
  // Example: Update the user profile with the data from the request
  // You can use req.user._id to find the authenticated user
  res.status(200).json({ message: "Profile updated successfully" });
});

export default router;
