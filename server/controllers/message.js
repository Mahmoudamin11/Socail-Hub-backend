// controllers/message.js
import Message from '../models/Message.js';
import { createError } from "../error.js";
import { createNotificationForUser } from './notification.js';
import Community from '../models/Community.js';
import User from '../models/User.js';
import { addHistory } from '../controllers/historyController.js';
import path from 'path';
import upload from '../upload.js';

// Function to get the full name of a user by their ID
export const getUserFullName = async (userId) => {
  try {
    const user = await User.findById(userId);
    return user ? user.name : '';
  } catch (error) {
    console.error('Error getting user full name:', error);
    return '';
  }
};

// Helper function to check if a user is blocked
const isUserBlocked = async (senderId, receiverId) => {
  try {
    const sender = await User.findById(senderId);
    return sender ? sender.blockedUsers.includes(receiverId) : false;
  } catch (error) {
    console.error('Error checking if user is blocked:', error);
    return false;
  }
};



export const sendMessage = async (req, res, next) => {
  upload.single('media')(req, res, async (err) => {
    if (err) {
      console.error(err); // Log the error for debugging
      return next(createError(500, 'File upload failed'));
    }

    try {
      const senderId = req.user.id;
      const { receiverId, content } = req.body;
      let photoUrl = null;
      let videoUrl = null;

      const isReceiverBlocked = await isUserBlocked(senderId, receiverId);

      if (isReceiverBlocked) {
        return res.status(403).json({ success: false, message: 'Cannot send messages to blocked users' });
      }

      if (req.file) {
        const fileExtension = path.extname(req.file.filename).toLowerCase();
        if (fileExtension === '.jpg' || fileExtension === '.jpeg' || fileExtension === '.png') {
          photoUrl = req.file.path;
        } else if (fileExtension === '.mp4' || fileExtension === '.mov') {
          videoUrl = req.file.path;
        }
      }

      const message = new Message({ senderId, receiverId, content, photoUrl, videoUrl });
      await message.save();

      const notificationMessage = `${req.user.name} sent you a message: "${content}"`;
      await createNotificationForUser(senderId, receiverId, notificationMessage);

      res.status(201).json(message);
    } catch (error) {
      next(error);
    }
  });
};


export const getConversation = async (req, res, next) => {
  try {
    const senderId = req.user.id; // Assuming req.user.id is the sender's ID from JWT
    const receiverId = req.query.receiverId;

    const messages = await Message.find({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (error) {
    next(error);
  }
};

export const markMessageAsRead = async (req, res, next) => {
  try {
    const messageId = req.params.messageId; // Assuming messageId is passed in the request params
    const message = await Message.findById(messageId);
    
    if (!message) {
      return next(createError(404, "Message not found"));
    }

    message.isRead = true;
    await message.save();
    await addHistory(message.senderId, `isRead_message`);

    res.status(200).json({ success: true, message: "Message marked as read" });
  } catch (error) {
    next(error);
  }
};

export const getGroupConversations = async (req, res, next) => {
  try {
    const { groupId } = req.body; // Assuming groupId is passed in the JSON body

    if (!groupId) {
      return res.status(400).json({ message: 'groupId is required in the request body' });
    }

    const messages = await Message.find({ groupId }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (error) {
    next(error);
  }
};

// Function to get community members based on communityId
const getCommunityMembers = async (communityId) => {
  const community = await Community.findById(communityId);
  return community ? community.members : [];
};

export const sendCommunityMessage = async (req, res, next) => {
  upload.single('media')(req, res, async (err) => {
    if (err) {
      return next(createError(500, 'File upload failed'));
    }

    try {
      const { communityId, content } = req.body;
      const senderId = req.user.id;
      let photoUrl = null;
      let videoUrl = null;

      if (!communityId || !content || !senderId) {
        return res.status(400).json({ success: false, message: 'CommunityId, content, and senderId are required' });
      }

      if (req.file) {
        const fileExtension = path.extname(req.file.filename).toLowerCase();
        if (fileExtension === '.jpg' || fileExtension === '.jpeg' || fileExtension === '.png') {
          photoUrl = req.file.path;
        } else if (fileExtension === '.mp4' || fileExtension === '.mov') {
          videoUrl = req.file.path;
        }
      }

      const senderName = await getUserFullName(senderId);

      const community = await Community.findById(communityId);

      if (!community) {
        return res.status(404).json({ success: false, message: 'Community not found' });
      }

      const members = await getCommunityMembers(communityId);

      members.forEach(async (memberId) => {
        const notificationMessage = `${senderName} sent a message in the community "${community.name}" - ${content}`;
        await createNotificationForUser(senderId, memberId, notificationMessage);
      });

      res.status(201).json({ success: true, message: 'Community message sent successfully' });
    } catch (error) {
      next(error);
    }
  });
};
