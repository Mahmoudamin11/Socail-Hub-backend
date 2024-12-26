import jwt from "jsonwebtoken";
import { createError } from "./error.js";
import User from "./models/User.js";

export const verifyToken = async (req, res, next) => {
  const accessToken = req.cookies.access_token; // استخراج Access Token من الكوكيز
  const refreshToken = req.cookies.refresh_token; // استخراج Refresh Token من الكوكيز

  if (!accessToken) {
    console.log("Access token missing. Checking refresh token...");
    
    // التحقق من وجود Refresh Token
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "You are not authenticated! Refresh token is missing.",
        status: 401,
      });
    }

    // التحقق من صحة Refresh Token
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) {
        console.error("Invalid refresh token:", err);
        return res.status(403).json({
          success: false,
          message: "Invalid refresh token.",
          status: 403,
        });
      }

      // إنشاء Access Token جديد
      const newAccessToken = jwt.sign(
        { id: decoded.id, name: decoded.name },
        process.env.JWT_SECRET,
        { expiresIn: "15m" } // صلاحية التوكن الجديد
      );

      // تحديث Access Token في الكوكيز
      res.cookie("access_token", newAccessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
        maxAge: 15*60 * 1000, // 15 min
      });

      console.log("New access token issued for user:", decoded.name);

      req.user = decoded; // إضافة معلومات المستخدم للطلب
      return next(); // استمر في المعالجة
    });
  } else {
    // التحقق من صلاحية Access Token
    jwt.verify(accessToken, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          console.log("Access token expired. Attempting to refresh...");

          // التحقق من وجود Refresh Token
          if (!refreshToken) {
            return res.status(401).json({
              success: false,
              message: "Refresh token is missing. Please log in again.",
              status: 401,
            });
          }

          // التحقق من صحة Refresh Token
          jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (refreshErr, decoded) => {
            if (refreshErr) {
              console.error("Invalid refresh token:", refreshErr);
              return res.status(403).json({
                success: false,
                message: "Invalid refresh token.",
                status: 403,
              });
            }

            // إنشاء Access Token جديد
            const newAccessToken = jwt.sign(
              { id: decoded.id, name: decoded.name },
              process.env.JWT_SECRET,
              { expiresIn: "15m" } // صلاحية التوكن الجديد
            );

            // تحديث Access Token في الكوكيز
            res.cookie("access_token", newAccessToken, {
              httpOnly: true,
              secure: true,
              sameSite: "Strict",
              maxAge: 15 * 60 * 1000, // 15 ثانية
            });

            console.log("New access token issued for user:", decoded.name);

            req.user = decoded; // إضافة معلومات المستخدم للطلب
            return next(); // استمر في المعالجة
          });
        } else {
          console.error("Invalid access token:", err);
          return res.status(403).json({
            success: false,
            message: "Invalid access token.",
            status: 403,
          });
        }
      } else {
        req.user = decoded;
        console.log("Access token verified successfully for user:", decoded.name);
        next();
      }
    });
  }
};
