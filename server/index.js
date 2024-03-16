// index.js


import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import userRoutes from "./routes/users.js";
import videoRoutes from "./routes/videos.js";
import commentRoutes from "./routes/comments.js";
import authRoutes from "./routes/auth.js";
import cookieParser from "cookie-parser";
import PostRoutes from "./routes/routPost.js";
import MessageRoutes from "./routes/messages.js";
import NotificationRoutes from "./routes/notifications.js";
import CommunitiesRoutes from "./routes/communities.js";
import BalanceRoutes from './routes/balances.js';
import ownerRoutes from './routes/ownners.js';
import chatGPTRoutes from './routes/chatGPTRoutes.js'; // Import the new route
import premiumPlanRoutes from './routes/premiumPlanRoutes.js'; // Add this line
import { createServer } from "http";
import { Server } from "socket.io";



const app = express();
dotenv.config();

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

global.onlineUsers = new Map();
io.on("connection", (socket) => {
  global.chatSocket = socket;
  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-recieve", data.msg);
    }
  });
});

const connect = () => {
  mongoose
    .connect(process.env.MONGO)
    .then(() => {
      console.log("!!!!!!!!!!!!......+++.............******CONNECTED TO MONGO_DB*******.......+++.......!!!!!!!!!!!!!!!");
    })
    .catch((err) => {
      console.error("Failed to connect to MongoDB:", err);
      process.exit(1);
    });
};

const PORT = process.env.Port;
server.listen(PORT, () => {
  connect();
  console.log(`Server is running on port ${PORT}`);
});

const apiKey = process.env.OPENAI_API_KEY;
;
 console.log("API Key:", apiKey);

app.use(cookieParser());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/routPost", PostRoutes);
app.use("/api/messages", MessageRoutes);
app.use("/api/notifications", NotificationRoutes);
app.use("/api/communities", CommunitiesRoutes);
app.use("/api/balances", BalanceRoutes);
app.use("/api/Owners", ownerRoutes);
app.use('/api/chatgpt', chatGPTRoutes);
app.use('/api/premium-plans', premiumPlanRoutes); // Adjusted route

app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Something went wrong!";
  return res.status(status).json({
    success: false,
    status,
    message,
  });
});

