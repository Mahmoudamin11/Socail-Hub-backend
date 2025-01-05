import Post from "../models/Post.js";
import { createError } from "../error.js";
import User from "../models/User.js";
import { createNotificationsForSubscribersOrFollowers } from '../controllers/notification.js';
import { createNotificationForOwner } from './notification.js'; // Assuming you have the notification functions in a separate file
import { addHistory } from '../controllers/historyController.js'; // Import the function to add history entries
import crypto from 'crypto'; // For generating unique keys
import { encrypt } from './bycripting_algorithem.js'; // استدعاء ملف التشفير

import mongoose from 'mongoose';

import bcrypt from 'bcrypt';





export const addPost = async (req, res, next) => {
  try {
    // العثور على المستخدم
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(createError(404, "User not found"));
    }

    // إنشاء النص الأساسي لتشفير postKey
    const uniqueIdentifier = `${req.user.id}-${Date.now()}`;
    const appName = "Social_Hub";

    // تشفير postKey
    const encryptedPostKey = `${encrypt(uniqueIdentifier)}-${appName}`;

    // إنشاء المنشور
    const newPost = new Post({
      userId: req.user.id,
      postKey: encryptedPostKey,
      ...req.body,
    });
    const savedPost = await newPost.save();

    // إنشاء الإشعارات
    const message = `New post added by ("${user.name}")`;
    await createNotificationsForSubscribersOrFollowers(req.user.id, message);
    await addHistory(req.user.id, `You Added (Post)`);

    res.status(200).json(savedPost);
  } catch (error) {
    console.error('Error adding post:', error.message);
    next(error);
  }
};




export const updatePost = async (req, res, next) => {
  try {
    const founded = await Post.findById(req.params.id);
    if (!founded) return next(createError(404, "Post not found!"));
    if (req.user.id === founded.userId) {
      const updatedPost = await Post.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true }
      );
      res.status(200).json(updatedPost);
      await addHistory(req.user.id, `You Updated Your Post : ${founded.title}`);

    } else {
      return next(createError(403, "You can update only your Post!"));
    }
  } catch (err) {
    next(err);
  }
};

export const deletePost = async (req, res, next) => {
  try {
    const founded = await Post.findById(req.params.id);
    if (!founded) return next(createError(404, "Post not found!"));
    if (req.user.id === founded.userId) {
      await Post.findByIdAndDelete(req.params.id);
      await addHistory(req.user.id, `You Deleted Your Post : ${founded.title}`);

      res.status(200).json("The Post has been deleted.");
    } else {
      return next(createError(403, "You can delete only your Post!"));
    }
  } catch (err) {
    next(err);
  }
};

export const getPostsById = async (req, res, next) => {
  const userId = req.params.id;

  try {
    // Fetch posts sorted by createdAt in descending order (newest to oldest)
    const posts = await Post.find({ userId }).sort({ createdAt: -1 });

    // If no posts exist, return an empty array with success
    if (!posts || posts.length === 0) {
      return res.status(200).json({ success: true, posts: [] }); // Change: return empty array with success
    }

    // Fetch the logged-in user to check saved posts
    const loggedInUserId = req.user.id;
    const user = await User.findById(loggedInUserId);

    const postsWithSavedStatus = posts.map(post => {
      const isSaved = user.savedPosts.some(savedItem => savedItem._id.toString() === post._id.toString());
      const isLiked = post.likes.includes(loggedInUserId);
      const isDisliked = post.dislikes.includes(loggedInUserId);
      return { ...post.toObject(), isSaved, isLiked, isDisliked };
    });

    res.status(200).json({ success: true, posts: postsWithSavedStatus });
  } catch (err) {
    console.error("Error fetching posts:", err.message);
    next(err); // Pass error to middleware
  }
};



export const random = async (req, res, next) => {
  try {
    const posts = await Post.aggregate([{ $sample: { size: 40 } }]);
    res.status(200).json(posts);
  } catch (err) {
    next(err);
  }
};










export const likePost = async (req, res, next) => {
  const loggedInUserId = req.user.id; // Assuming you have the ID of the currently signed-in user
  const postId = req.params.id;

  try {
    // Retrieve the post and owner information
    const post = await Post.findById(postId);
    if (!post) {
      return next(createError(404, 'Post not found'));
    }

    const ownerId = post.userId; // Assuming 'userId' field in Post model represents the owner's user ID

    // Check if the user has already liked the post
    if (post.likes.includes(loggedInUserId)) {
      return res.status(400).json({ error: 'You have already liked this post before' });
    }

    // Define senderId assuming it comes from the currently signed-in user
    const senderId = req.user.id;

    // Check if the receiver is blocked by the sender
    const isReceiverBlocked = await isUserBlocked(senderId, ownerId); // Assuming ownerId represents the receiver

    if (isReceiverBlocked) {
      return res.status(403).json({ success: false, message: 'Cannot like to blocked users' });
    }

    // Remove user from dislikes list if they are present
    if (post.dislikes.includes(loggedInUserId)) {
      post.dislikes.pull(loggedInUserId); // Remove user from dislikes list
    }

    // Update the post's likes array to include the user's ID
    post.likes.push(loggedInUserId);
    await post.save();

    const loggedInUser = await User.findById(loggedInUserId);
    const loggedInUserName = loggedInUser.name;

    // Notify the owner of the post
    const notificationMessage = `"${loggedInUserName}" liked your post`; // Customize the message as needed
    await createNotificationForOwner(loggedInUserId, ownerId, notificationMessage);
    await addHistory(req.user.id, `You Liked On Post : ${post.title}`);

    res.status(200).json({ message: 'Post liked successfully' });
  } catch (err) {
    next(err);
  }
};











export const dislikePost = async (req, res, next) => {
  const loggedInUserId = req.user.id; // Assuming you have the ID of the currently signed-in user
  const postId = req.params.id;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return next(createError(404, 'Post not found'));
    }

    // Check if the user has already disliked the post
    if (post.dislikes.includes(loggedInUserId)) {
      return res.status(400).json({ error: 'You have already disliked this post' });
    }

    // Define senderId assuming it comes from the currently signed-in user
    const senderId = req.user.id;

    // Check if the receiver is blocked by the sender
    const isReceiverBlocked = await isUserBlocked(senderId, post.userId); // Assuming post.userId represents the receiver

    if (isReceiverBlocked) {
      return res.status(403).json({ success: false, message: 'Cannot send dislike to blocked users' });
    }

    // Remove user from likes list if they are present
    if (post.likes.includes(loggedInUserId)) {
      post.likes.pull(loggedInUserId); // Remove user from likes list
    }

    // Update the post's dislikes array to include the user's ID
    post.dislikes.push(loggedInUserId);
    await post.save();

    // Retrieve the user's name
    const loggedInUser = await User.findById(loggedInUserId);
    const loggedInUserName = loggedInUser.name;

    // Notify the owner of the post
    const ownerId = post.userId; // Assuming 'userId' field in Post model represents the owner's user ID
    const notificationMessage = `"${loggedInUserName}" disliked your post`; // Use the user's name in the message
    await createNotificationForOwner(loggedInUserId, ownerId, notificationMessage);
    await addHistory(req.user.id, `You Disliked On Post : ${post.title}`);

    res.status(200).json({ message: 'Post disliked successfully' });
  } catch (err) {
    next(err);
  }
};



export const savePost = async (req, res, next) => {
  const loggedInUserId = req.user.id; // Assuming you have the ID of the currently signed-in user
  const postId = req.params.id;

  try {
    // Find the user by ID
    const user = await User.findById(loggedInUserId);
    if (!user) {
      return next(createError(404, "User not found"));
    }

    // Check if user.savedPosts is defined
    if (!user.savedPosts) {
      user.savedPosts = []; // Initialize savedPosts array if undefined
    }

    // Find the post by ID
    const post = await Post.findById(postId).populate("userId", "name profilePicture");
    if (!post) {
      return next(createError(404, "Post not found"));
    }

    // Check if the post is already saved
    const alreadySaved = user.savedPosts.find(
      (savedItem) => savedItem._id.toString() === postId
    );
    if (alreadySaved) {
      return res.status(400).json({ success: false, message: "Post already saved" });
    }

    // Add the post data to the user's savedPosts array
    user.savedPosts.push({
      _id: post._id,
      title: post.title,
      desc: post.desc,
      imgUrl: post.imgUrl,
      videoUrl: post.videoUrl,
      tags: post.tags,
      likes: post.likes,
      postKey: post.postKey,
      dislikes: post.dislikes,
      ownerName: post.userId?.name || "Unknown Owner", // Add owner's name with fallback
      ownerProfilePicture: post.userId?.profilePicture || "", // Add owner's profile picture with fallback
      ownerId: post.userId?._id || null, // Add owner's ID with fallback
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    });

    // Save the user document
    await user.save();

    // Retrieve the user's name
    const loggedInUserName = user.name;

    // Notify the owner of the post
    if (post.userId) {
      const notificationMessage = `${loggedInUserName} saved your post`;
      await createNotificationForOwner(loggedInUserId, post.userId._id, notificationMessage);
    }

    // Add a history record
    await addHistory(req.user.id, `You saved a post: ${post.title}`);

    res.status(200).json({ success: true, message: "Post saved successfully" });
  } catch (err) {
    console.error("Error saving post:", err);
    next(err);
  }
};




export const unsavePost = async (req, res, next) => {
  try {
    const loggedInUserId = req.user.id;

    // Find the user by ID
    const user = await User.findById(loggedInUserId);
    if (!user) return next(createError(404, 'User not found!'));

    // Find the saved post in the user's savedPosts
    const postIndex = user.savedPosts.findIndex(
      (savedItem) => savedItem._id.toString() === req.params.id
    );

    if (postIndex === -1) return next(createError(400, 'Post is not saved!'));

    // Remove the post from savedPosts
    const removedPost = user.savedPosts.splice(postIndex, 1)[0];
    await user.save();

    // Add a history record
    await addHistory(req.user.id, `You unsaved a post: ${removedPost.title}`);

    res.status(200).json({ message: 'Post unsaved successfully.' });
  } catch (err) {
    next(err);
  }
};


export const getSavedPosts = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Fetch the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return next(createError(404, "User not found"));
    }

    // Check if the user has saved posts
    if (!user.savedPosts || user.savedPosts.length === 0) {
      return res.status(404).json({ success: false, message: "No saved posts found." });
    }

    // Fetch the saved posts with owner details
    const savedPosts = await Post.find({ _id: { $in: user.savedPosts } })
      .populate('userId', 'name profilePicture _id'); // Populate owner details

    // Format the posts with owner information
    const formattedPosts = savedPosts.map(post => ({
      ...post.toObject(),
      owner: {
        id: post.userId?._id,
        name: post.userId?.name,
        profilePicture: post.userId?.profilePicture,
      },
    }));

    // Return the saved posts
    res.status(200).json({ success: true, savedPosts: formattedPosts });
  } catch (err) {
    console.error("Error fetching saved posts:", err);
    next(err);
  }
};







//...........................??????????
export const copyUrl = async (req, res, next) => {
  try {
    const podt = await Post.findById(req.params.id);
    if (!podt) {
      return next(createError(404, "Post not found"));
    }
    
    // Extract the Post URL
    const postUrl = Post.id;

    res.status(200).json({ success: true, postUrl });
  } catch (err) {
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

