import Message from '../models/Message.js';
import { createError } from "../error.js";
import { createNotificationForUser } from './notification.js';
import Community from '../models/Community.js';
import User from '../models/User.js';





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
  try {
    const senderId = req.user.id;
    const { receiverId, content } = req.body;

    // Check if the receiver is blocked by the sender
    const isReceiverBlocked = await isUserBlocked(senderId, receiverId);

    if (isReceiverBlocked) {
      return res.status(403).json({ success: false, message: 'Cannot send messages to blocked users' });
    }

    // Create a new message
    const message = new Message({ senderId, receiverId, content });
    await message.save();

    // Notify the receiver about the new message
    const notificationMessage = `${req.user.name} sent you a message: "${content}"`;
    await createNotificationForUser(senderId, receiverId, notificationMessage);
    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
};









export const getConversation = async (req, res, next) => {
  try {
    const senderId = req.user.id; // Assuming req.user.id is the sender's ID from JWT
    const receiverId = req.body.receiverId;

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






// Function to mark a message as read
export const markMessageAsRead = async (req, res, next) => {
  try {
    const messageId = req.params.messageId; // Assuming messageId is passed in the request params
    const message = await Message.findById(messageId);
    
    // Check if the message exists
    if (!message) {
      return next(createError(404, "Message not found"));
    }

    // Mark the message as read
    message.isRead = true;
    await message.save();

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

// Function to send messages in communities
export const sendCommunityMessage = async (req, res, next) => {
  try {
      const { communityId, content } = req.body;
      const senderId = req.user.id; // Assuming you have a logged-in user

      // Validate if communityId, content, and senderId are provided
      if (!communityId || !content || !senderId) {
          return res.status(400).json({ success: false, message: 'CommunityId, content, and senderId are required' });
      }

      // Get sender's name
      const senderName = await getUserFullName(senderId);

      // Get community details
      const community = await Community.findById(communityId);

      // Validate if the community exists
      if (!community) {
          return res.status(404).json({ success: false, message: 'Community not found' });
      }

      // Get community members
      const members = await getCommunityMembers(communityId);

      // Send the message and create notifications for each member
      members.forEach(async (memberId) => {
          const notificationMessage = `${senderName} sent a message in the community "${community.name}" - ${content}`;
          await createNotificationForUser(senderId, memberId, notificationMessage);
      });

      res.status(201).json({ success: true, message: 'Community message sent successfully' });
  } catch (error) {
      next(error);
  }
};