import jwt from "jsonwebtoken";
import { createError } from "./error.js";

export const verifyToken = (req, res, next) => {
  const token = req.cookies.access_token; // Token is in cookies

  if (!token) return next(createError(401, "You are not authenticated!"));

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      // Check if the error is due to token expiration
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          message: "Access token expired. Please refresh your token.",
          code: "TOKEN_EXPIRED",
        });
      }

      return next(createError(403, "Token is not valid!"));
    }

    req.user = user;
    next();
  });
};
