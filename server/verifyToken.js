import jwt from "jsonwebtoken";
import { createError } from "./error.js";
import User from "./models/User.js";

export const verifyToken = async (req, res, next) => {
  const accessToken = req.cookies.access_token; // استخراج Access Token من الكوكيز
  const refreshToken = req.cookies.refresh_token; // استخراج Refresh Token من الكوكيز

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: "Authentication failed: Refresh token is missing.",
    });
  }

  // التحقق من صلاحية Access Token
  if (!accessToken) {
    return jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: "Authentication failed: Invalid or expired refresh token.",
        });
      }

      // إنشاء Access Token جديد
      const newAccessToken = jwt.sign(
        { id: decoded.id, name: decoded.name },
        process.env.JWT_SECRET,
        { expiresIn: "15s" } // 15 ثانية
      );

      res.cookie("access_token", newAccessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
        maxAge: 15 * 1000, // 15 ثانية
      });

      req.user = decoded; // إضافة معلومات المستخدم
      return next();
    });
  }

  jwt.verify(accessToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        // إذا انتهت صلاحية Access Token، حاول تجديدها باستخدام Refresh Token
        return jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (refreshErr, decodedRefresh) => {
          if (refreshErr) {
            return res.status(403).json({
              success: false,
              message: "Authentication failed: Invalid or expired refresh token.",
            });
          }

          const newAccessToken = jwt.sign(
            { id: decodedRefresh.id, name: decodedRefresh.name },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
          );

          res.cookie("access_token", newAccessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "Strict",
            maxAge: 15 * 60 * 1000,
          });

          req.user = decodedRefresh;
          return next();
        });
      } else {
        return res.status(403).json({
          success: false,
          message: "Authentication failed: Invalid access token.",
        });
      }
    } else {
      req.user = decoded;
      next();
    }
  });
};
