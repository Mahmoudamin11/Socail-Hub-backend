import { createError } from "../error.js";
import User from "../models/User.js";
import Video from "../models/Video.js";
import Post from "../models/Post.js";
import bcrypt from 'bcrypt';
import { createNotificationForOwner } from './notification.js'; // Assuming you have the notification functions in a separate file
import { createNotificationsForSubscribersOrFollowers } from '../controllers/notification.js';
import { addCoins } from './balance.js'; // Assuming you have the notification functions in a separate file
import { createSystemNotificationForUser } from '../controllers/notification.js';
import { deductCoinsNew } from '../controllers/balance.js'; // Adjust the path accordingly
import { addHistory } from '../controllers/historyController.js'; // Import the function to add history entries
import mongoose from 'mongoose';

import { getBalance } from './balance.js';



export const update = async (req, res, next) => {
  if (req.params.id === req.user.id) {
    try {
      // Check if the current password is provided in the request body
      if (!req.body.currentPassword) {
        return next(createError(400, "Current password is required for update"));
      }

      // Find the user by ID
      const user = await User.findById(req.params.id);
      if (!user) {
        return next(createError(404, "User not found"));
      }

      // Verify the current password
      const isPasswordValid = await bcrypt.compare(req.body.currentPassword, user.password);
      if (!isPasswordValid) {
        return next(createError(401, "Incorrect current password"));
      }

      // Check if a new password is provided in the request body
      if (req.body.password) {
        // Check if the new password is the same as the current password
        const isNewPasswordSameAsCurrent = await bcrypt.compare(req.body.password, user.password);
        if (isNewPasswordSameAsCurrent) {
          return next(createError(400, "Please choose a new password"));
        }
        
        // Hash the new password
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        // Replace the plain text password with the hashed password in the request body
        req.body.password = hashedPassword;
      }

      // Update the user (excluding the password field from the returned user object)
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        {
          $set: req.body,
        },
        { new: true }
      ).select("-password");

      // Notify subscribers or followers about the profile update
      const notificationMessage = `${updatedUser.name}'s profile has been updated.`;
      await createNotificationsForSubscribersOrFollowers(updatedUser._id, notificationMessage);

      res.status(200).json(updatedUser);
    } catch (err) {
      next(err);
    }
  } else {
    return next(createError(403, "You can update only your account!"));
  }
};




export const deleteUser = async (req, res, next) => {
  if (req.params.id === req.user.id) {
    try {
      // Check if the current password is provided in the request body
      if (!req.body.currentPassword) {
        return next(createError(400, "Current password is required for deletion"));
      }

      // Find the user by ID
      const user = await User.findById(req.params.id);
      if (!user) {
        return next(createError(404, "User not found"));
      }

      // Verify the current password
      const isPasswordValid = await bcrypt.compare(req.body.currentPassword, user.password);
      if (!isPasswordValid) {
        return next(createError(401, "Incorrect current password"));
      }

      // Delete the user
      await User.findByIdAndDelete(req.params.id);
      res.status(200).json("User has been deleted.");
    } catch (err) {
      next(err);
    }
  } else {
    return next(createError(403, "You can delete only your account!"));
  }
};






export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};




export const subscribe = async (req, res, next) => {
  try {
    const loggedInUserId = req.user.id; // Assuming you have the ID of the currently signed-in user
    const videoOwnerId = req.params.id;

    // Check if the current user is trying to subscribe to their own channel
    if (loggedInUserId === videoOwnerId) {
      return res.status(400).json("You cannot subscribe to your own channel.");
    }
    
    // Define senderId and receiverId for checking blocked users
    const senderId = loggedInUserId;
    const receiverId = videoOwnerId;
    
    // Check if the receiver is blocked by the sender
    const isReceiverBlocked = await isUserBlocked(senderId, receiverId);

    if (isReceiverBlocked) {
      return res.status(403).json({ success: false, message: 'Cannot subscribe to blocked users' });
    }

    // Check if the current user is already subscribed to the channel
    const videoOwner = await User.findById(videoOwnerId);
    if (!videoOwner) {
      return res.status(404).json("Channel owner not found.");
    }

    if (videoOwner.SubscribersOrFollowers.includes(loggedInUserId)) {
      return res.status(400).json("You are already subscribed to this channel.");
    }

    // Update the user who owns the channel (add the subscriber's ID)
    await User.findByIdAndUpdate(videoOwnerId, {
      $push: { SubscribersOrFollowers: loggedInUserId }
    });

    // Update the current user (add the channel owner's ID to subscribed channels)
    await User.findByIdAndUpdate(loggedInUserId, {
      $push: { SubscriberedOrFollowed: videoOwnerId }
    });

    // Retrieve the user's name
    const loggedInUserName = (await User.findById(loggedInUserId)).name;

    // Notify the channel owner about the new subscriber
    const notificationMessage = `${loggedInUserName} subscribed to your channel`; // Use the user's name in the message
    await createNotificationForOwner(loggedInUserId, videoOwnerId, notificationMessage);
    
    // Add subscription history
    await addHistory(loggedInUserId, `You Subscribed to  : ${videoOwner.name} channel.`);

    res.status(200).json("Subscription successful.");
  } catch (err) {
    next(err);
  }
};



export const unsubscribe = async (req, res, next) => {
  try {
    const loggedInUserId = req.user.id; // Assuming you have the ID of the currently signed-in user
    const videoOwnerId = req.params.id;

    // Check if the current user is trying to unsubscribe from their own channel
    if (loggedInUserId === videoOwnerId) {
      return res.status(400).json("You cannot unsubscribe from your own channel.");
    }

    // Check if the current user is subscribed to the channel
    const user = await User.findById(loggedInUserId);
    if (!user.SubscriberedOrFollowed.includes(videoOwnerId)) {
      return res.status(400).json("You are not subscribed to this channel.");
    }

    // Update the user who owns the channel (remove the subscriber's ID)
    await User.findByIdAndUpdate(videoOwnerId, {
      $pull: { SubscribersOrFollowers: loggedInUserId }
    });

    // Update the current user (remove the channel owner's ID from subscribed channels)
    await User.findByIdAndUpdate(loggedInUserId, {
      $pull: { SubscriberedOrFollowed: videoOwnerId }
    });

    // Retrieve the user's name
    const loggedInUserName = user.name;
    const videoOwner = await User.findById(videoOwnerId);

    // Notify the channel owner about the unsubscription
    const notificationMessage = `${loggedInUserName} unsubscribed from your channel`; // Use the user's name in the message
    await createNotificationForOwner(loggedInUserId, videoOwnerId, notificationMessage);
    await addHistory(loggedInUserId, `You Unsubscribed to : ${videoOwner.name} channel.`);

    res.status(200).json("Unsubscription successful.");
  } catch (err) {
    next(err);
  }
};



export const likeOnVideo = async (req, res, next) => {
  const loggedInUserId = req.user.id;
  const videoId = req.params.videoId;

  try {
    let message = ""; // Initialize a variable to store the message

    if (videoId) {
      // If videoId is provided, update the video
      const video = await Video.findById(videoId);
      if (!video) {
        return next(createError(404, "Video not found"));
      }

      const senderId = loggedInUserId; // Define senderId as the logged-in user's ID

      // Check if the receiver is blocked by the sender
      const receiverId = video.userId; // Assuming video.userId represents the owner of the video
      const isReceiverBlocked = await isUserBlocked(senderId, receiverId);

      if (video.likes.includes(loggedInUserId)) {
        message = "You have already liked this video.";
      } else {
        await Video.findByIdAndUpdate(videoId, {
          $addToSet: { likes: loggedInUserId },
          $pull: { dislikes: loggedInUserId }
        });
        message = "The video has been liked.";

        if (isReceiverBlocked) {
          return res.status(403).json({ success: false, message: 'Cannot like to blocked users' });
        }

        const loggedInUser = await User.findById(loggedInUserId);
        const loggedInUserName = loggedInUser.name;
        // Notify the owner of the video
        const ownerUserId = video.userId;
        const notificationMessage = `"${loggedInUserName}" liked your video`;
        await createNotificationForOwner(loggedInUserId, ownerUserId, notificationMessage);
        await addHistory(loggedInUserId, `You Liked On Video   : ${video.title}" channel.`);

      }
    } else {
      // Handle the case when videoId is not provided
      return res.status(400).json({ error: "Invalid request: videoId is required." });
    }

    res.status(200).json({ message }); // Return a JSON response with the message
  } catch (err) {
    next(err);
  }
};



export const dislikeOnVideo = async (req, res, next) => {
  const loggedInUserId = req.user.id;
  const videoId = req.params.videoId;

  try {
    let message = ""; // Initialize a variable to store the message

    if (videoId) {
      // If videoId is provided, update the video
      const video = await Video.findById(videoId);
      if (!video) {
        return next(createError(404, "Video not found"));
      }

      // Check if the receiver is blocked by the sender
      const senderId = loggedInUserId;
      const receiverId = video.userId;
      const isReceiverBlocked = await isUserBlocked(senderId, receiverId);
      if (isReceiverBlocked) {
        return res.status(403).json({ success: false, message: 'Cannot Dislike to blocked users' });
      }

      // Check if the user has already disliked the video
      if (video.dislikes.includes(loggedInUserId)) {
        message = "You have already disliked this video. You cannot dislike it again.";
      } else {
        // If the user has not disliked the video, update the dislikes
        await Video.findByIdAndUpdate(videoId, {
          $addToSet: { dislikes: loggedInUserId },
          $pull: { likes: loggedInUserId }
        });
        message = "The video has been disliked.";

        const loggedInUser = await User.findById(loggedInUserId);
        const loggedInUserName = loggedInUser.name;
        // Notify the owner of the video
        const ownerUserId = video.userId;
        const notificationMessage = `${loggedInUserName} disliked your video`;
        await createNotificationForOwner(loggedInUserId, ownerUserId, notificationMessage);
        await addHistory(loggedInUserId, `You Disliked On Video   : ${video.title}" channel.`);

      }
    } else {
      // Handle the case when videoId is not provided
      return res.status(400).json({ error: "Invalid request: videoId is required." });
    }

    res.status(200).json({ message }); // Return a JSON response with the message
  } catch (err) {
    next(err);
  }
};





export const sendFriendRequest = async (req, res, next) => {
  try {
    const senderId = req.user.id;
    const receiverId = req.params.receiverId;

    // Check if the sender and receiver are different users
    if (senderId === receiverId) {
      return res.status(400).json("You cannot send a friend request to yourself.");
    }



    
    // Check if the receiver is blocked by the sender
    const isReceiverBlocked = await isUserBlocked(senderId, receiverId);

    if (isReceiverBlocked) {
      return res.status(403).json({ success: false, message: 'Cannot send messages to blocked users' });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json("Receiver not found.");
    }

    // Check if the receiver is already a friend
    if (receiver.friends.includes(senderId)) {
      return res.status(400).json("User is already your friend.");
    }

    // Check if the friend request has already been sent
    if (receiver.friendRequests.some(request => request.sender.toString() === senderId)) {
      return res.status(400).json("Friend request already sent.");
    }

    // Add friend request to receiver's profile
    receiver.friendRequests.push({ sender: senderId });
    await receiver.save();

    // Notify the receiver about the friend request
    const senderUser = await User.findById(senderId);
    const notificationMessage = `${senderUser.name} sent you a friend request.`;
    await createNotificationForOwner(senderId, receiverId, notificationMessage);
    await addHistory(req.user.id, `You Send Frind Request To : ${receiver.name}" `);

    res.status(200).json("Friend request sent successfully.");
  } catch (err) {
    next(err);
  }
};












export const acceptFriendRequest = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const senderId = req.params.senderId;

    // Check if the sender and receiver are different users
    if (userId === senderId) {
      return res.status(400).json("You cannot accept a friend request from yourself.");
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json("User not found.");
    }

    // Check if the friend request exists
    const friendRequest = user.friendRequests.find(request => request.sender.toString() === senderId);
    if (!friendRequest) {
      return res.status(404).json("Friend request not found.");
    }

    // Remove friend request from user's profile
    user.friendRequests = user.friendRequests.filter(request => request.sender.toString() !== senderId);

    // Add sender to user's friends list
    user.friends.push(senderId);

    // Add user to sender's friends list (establishing a mutual friendship)
    const sender = await User.findById(senderId);
    sender.friends.push(userId);

    await Promise.all([user.save(), sender.save()]);

    // Notify the sender that the friend request has been accepted
    const senderUser = await User.findById(senderId);
    const notificationMessageForSender = `${user.name} accepted your friend request.`;
    await createNotificationForOwner(userId, senderId, notificationMessageForSender);
    await addHistory(req.user.id, `You Accept Frind Request From : ${sender.name}" `);

    
    res.status(200).json("Friend request accepted successfully.");
  } catch (err) {
    next(err);
  }
};



export const rejectFriendRequest = async (req, res, next) => {
  try {
    const userId = req.user.id; // المستخدم الحالي
    const senderId = req.params.senderId; // معرف المستخدم الذي أرسل الطلب

    // التحقق من أن المستخدم الحالي ليس نفس الشخص الذي أرسل الطلب
    if (userId === senderId) {
      return res.status(400).json("You cannot reject a friend request from yourself.");
    }

    // العثور على المستخدم الحالي
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json("User not found.");
    }

    // التحقق من وجود طلب الصداقة
    const friendRequest = user.friendRequests.find(request => request.sender.toString() === senderId);
    if (!friendRequest) {
      return res.status(404).json("Friend request not found.");
    }

    // إزالة طلب الصداقة
    user.friendRequests = user.friendRequests.filter(request => request.sender.toString() !== senderId);

    // حفظ التغييرات
    await user.save();

    // إرسال إشعار للمستخدم الذي تم رفض طلبه
    const senderUser = await User.findById(senderId);
    const notificationMessage = `${user.name} has rejected your friend request.`;
    await createNotificationForOwner(userId, senderId, notificationMessage);

    // تسجيل النشاط
    await addHistory(req.user.id, `You Rejected Frind Request From : ${senderUser.name}" `);

    res.status(200).json("Friend request rejected successfully.");
  } catch (err) {
    next(err);
  }
};






export const getMutualFriends = async (req, res, next) => {
  try {
    const loggedInUserId = req.user.id;
    const otherUserId = req.params.id;

    const loggedInUser = await User.findById(loggedInUserId).select("friends");
    const otherUser = await User.findById(otherUserId).select("friends");

    if (!loggedInUser || !otherUser) {
      throw new Error("One or both users not found.");
    }

    // Find the intersection of the friends lists to get mutual friends
    const mutualFriends = loggedInUser.friends.filter((friend) =>
      otherUser.friends.includes(friend)
    );

    res.status(200).json(mutualFriends);
  } catch (error) {
    next(error);
  }
};



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








export const blockUser = async (req, res, next) => {
  try {
    // Log the request user before the problematic line
    console.log("Request User:", req.user);

    const loggedInUserId = req.user.id;
    const userToBlockId = req.body.userToBlockId;

    // Check if the user is trying to block themselves
    if (loggedInUserId === userToBlockId) {
      return res.status(400).json("You cannot block yourself.");
    }

    // Check if the user to block exists
    const userToBlock = await User.findById(userToBlockId);
    if (!userToBlock) {
      return res.status(404).json("User to block not found.");
    }

    // Add debugging logs
    console.log("Blocked Users:", req.user.blockedUsers);
    console.log("User To Block ID:", userToBlockId);

    // Ensure blockedUsers is initialized
    req.user.blockedUsers = req.user.blockedUsers || [];

    // Check if the user is already blocked
    if (req.user.blockedUsers.includes(userToBlockId)) {
      console.log("User is already blocked:", req.user.blockedUsers);
      return res.status(400).json("User is already blocked.");
    }

    // Block the user
    req.user =     await User.findById(req.user.id);

    req.user.blockedUsers.push(userToBlockId);
    await req.user.save();

    // Remove all relations between users
    req.user.friends = req.user.friends?.filter(friendId => friendId.toString() !== userToBlockId);
    req.user.SubscriberedOrFollowed = req.user.SubscriberedOrFollowed?.filter(channelId => channelId.toString() !== userToBlockId);
    req.user.SubscribersOrFollowers = req.user.SubscribersOrFollowers?.filter(subscriberId => subscriberId.toString() !== userToBlockId);

    // Remove the blocked user from their friends, subscribers, and subscriptions
    userToBlock.friends = userToBlock.friends?.filter(friendId => friendId.toString() !== loggedInUserId);
    userToBlock.SubscriberedOrFollowed = userToBlock.SubscriberedOrFollowed?.filter(channelId => channelId.toString() !== loggedInUserId);
    userToBlock.SubscribersOrFollowers = userToBlock.SubscribersOrFollowers?.filter(subscriberId => subscriberId.toString() !== loggedInUserId);

    // Save changes to both users
    await Promise.all([req.user.save(), userToBlock.save()]);

    // Notify the blocked user
    const notificationMessage = `${req.user.name} blocked you, and all relations have been cut.`;
    await createNotificationForOwner(loggedInUserId, userToBlockId, notificationMessage);
    await addHistory(req.user.id, `You Bloked Your Frind  : ${userToBlock.name}" `);

    res.status(200).json("User blocked successfully. All relations have been cut.");
  } catch (err) {
    next(err);
  }
};







export const unblockUser = async (req, res, next) => {
  try {
    console.log('Start of unblockUser function');

    // Ensure User model is imported
    const loggedInUserId = req.user.id;
    const userToUnblockId = req.body.userToUnblockId;

    console.log('loggedInUserId:', loggedInUserId);
    console.log('userToUnblockId:', userToUnblockId);

    // Check if the user is trying to unblock themselves
    if (loggedInUserId === userToUnblockId) {
      return res.status(400).json("You cannot unblock yourself.");
    }

    // Check if the user to unblock exists
    const userToUnblock = await User.findById(userToUnblockId);
    if (!userToUnblock) {
      return res.status(404).json("User to unblock not found.");
    }

    // Get the relations before unblocking
    const user = await User.findById(loggedInUserId);

    // Perform the unblock logic
    user.blockedUsers = user.blockedUsers.filter((blockedUserId) => blockedUserId.toString() !== userToUnblockId.toString());

    // Deduct coins from loggedInUser and add to userToUnblock
    await deductCoinsNew(loggedInUserId, userToUnblockId, 20, res, next);

    // Save changes to the user
    await user.save();

    // Add users to each other's friends
    userToUnblock.friends = [...new Set([...userToUnblock.friends || [], loggedInUserId])];
    user.friends = [...new Set([...user.friends || [], userToUnblockId])];

    // Remove the blocked user from their friends, subscribers, and subscriptions
    userToUnblock.friends = userToUnblock.friends?.filter(friendId => friendId.toString() !== loggedInUserId);
    userToUnblock.SubscriberedOrFollowed = userToUnblock.SubscriberedOrFollowed?.filter(channelId => channelId.toString() !== loggedInUserId);
    userToUnblock.SubscribersOrFollowers = userToUnblock.SubscribersOrFollowers?.filter(subscriberId => subscriberId.toString() !== loggedInUserId);

    // Save changes to both users
    await Promise.all([userToUnblock.save()]);

    // Notify the unblocked user
    const notificationMessage = `${user.name} unblocked you, and all relations have been restored.`;
    await createSystemNotificationForUser(userToUnblockId, notificationMessage);
    await addHistory(req.user.id, `You UnBloked Your Frind  : ${userToUnblock.name}" `);

    console.log('End of unblockUser function');

    res.status(200).json("User unblocked successfully. All relations have been restored.");
  } catch (err) {
    console.error('Error in unblockUser:', err);
    next(err);
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


















export const getRandomUsers = async (req, res, next) => {
  const userId = req.user.id; // ID of the current user
  const { page = 1 } = req.query; // Default to page 1
  const pageSize = 10; // Number of users per page

  try {
    // Get current user's data
    const currentUser = await User.findById(userId).select("friends SubscribersOrFollowers");

    if (!currentUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const { friends } = currentUser;

    // Exclude friends and the current user from the search
    const excludedIds = [...friends.map(friend => friend.toString()), userId.toString()];

    // Fetch random users
    const users = await User.aggregate([
      {
        $match: {
          _id: { $nin: excludedIds.map(id => new mongoose.Types.ObjectId(id)) },
        },
      },
      {
        $addFields: {
          isFollower: {
            $in: ["$_id", currentUser.SubscribersOrFollowers.map(id => new mongoose.Types.ObjectId(id))],
          },
        },
      },
      {
        $sample: { size: pageSize },
      },
      {
        $project: {
          name: 1,
          email: 1,
          profilePicture: 1,
          isFollower: 1,
          SubscribersOrFollowers: 1, // Include temporarily to check for youFollow
          friendRequests: 1, // Include temporarily to check for sendFriendRequest
        },
      },
    ]);

    // Process each user to determine `youFollow` and `sendFriendRequest`
    const processedUsers = users.map(user => ({
      ...user,
      youFollow: user.SubscribersOrFollowers.includes(userId), // Check if userId is in SubscribersOrFollowers
      sendFriendRequest: user.friendRequests.some(
        request => request.sender.toString() === userId // Check if userId sent a friend request
      ),
    }));

    // Remove unnecessary fields from the final response
    const sanitizedUsers = processedUsers.map(({ SubscribersOrFollowers, friendRequests, ...rest }) => rest);

    if (!sanitizedUsers.length) {
      return res.status(404).json({ message: "No more users available." });
    }

    res.status(200).json({ success: true, users: sanitizedUsers });
  } catch (err) {
    console.error("Error in getRandomUsers:", err);
    next(err);
  }
};










export const advancedUserSearch = async (req, res, next) => {
  const { query } = req.body; // Expecting 'query' from the request body
  const userId = req.user.id; // Assuming user ID is available from authentication middleware

  try {
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ message: "Search query cannot be empty." });
    }

    // Build a regular expression for advanced matching
    const searchRegex = new RegExp(`^${query.split(" ").join(".*")}`, "i");

    // Get the current user to access friends and followers
    const currentUser = await User.findById(userId).select("friends SubscribersOrFollowers");

    if (!currentUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const { friends, SubscribersOrFollowers } = currentUser;

    // Find users matching the query, excluding friends and the current user
    const users = await User.find({
      _id: { $nin: [...friends, userId] }, // Exclude friends and the current user
      name: { $regex: searchRegex },
    }).select("name email profilePicture");

    if (users.length === 0) {
      return res.status(404).json({ message: "No users found matching your query." });
    }

    // Sort users: followers first, others last
    const sortedUsers = users.sort((a, b) => {
      const aIsFollower = SubscribersOrFollowers.includes(a._id.toString());
      const bIsFollower = SubscribersOrFollowers.includes(b._id.toString());

      if (aIsFollower && !bIsFollower) return -1;
      if (!aIsFollower && bIsFollower) return 1;
      return 0;
    });

    res.status(200).json({ success: true, users: sortedUsers });
  } catch (err) {
    next(err); // Pass errors to the global error handler
  }
};







export const getAllSavedItems = async (req, res, next) => {
  try {
    const userId = req.user.id; // Extract user ID from token

    // Fetch the user and their saved videos and posts
    const user = await User.findById(userId).select("savedVideos savedPosts");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch saved videos and posts from their respective models
    const savedVideos = await Video.find({ _id: { $in: user.savedVideos } }).select("title createdAt");
    const savedPosts = await Post.find({ _id: { $in: user.savedPosts } }).select("title createdAt");

    // Combine the results into a single array and sort by time (createdAt)
    const allItems = [...savedVideos, ...savedPosts].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    // Return the sorted list
    res.status(200).json({ success: true, items: allItems });
  } catch (err) {
    console.error("Error fetching saved items:", err);
    next(err);
  }
};