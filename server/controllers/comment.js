import { createError } from "../error.js";
import Comment from "../models/Comment.js";
import Video from "../models/Video.js";
import Post from "../models/Post.js";
import User from "../models/User.js";

import { createNotificationForOwner } from './notification.js'; // Assuming you have the notification functions in a separate file


export const addComment = async (req, res, next) => {
  const { objectId, desc, replyTo } = req.body;
  const userId = req.user.id;
  const userName = await User.findById(userId);

  try {
    let parentComment;
    let newComment; // Define newComment here

    // Check if it's a reply and find the parent comment
    if (replyTo) {
      parentComment = await Comment.findById(replyTo);
      if (!parentComment) {
        return next(createError(404, 'Parent comment not found'));
      }



      
    // Check if the receiver is blocked by the sender
    const isReceiverBlocked = await isUserBlocked(senderId, receiverId);

    if (isReceiverBlocked) {
      return res.status(403).json({ success: false, message: 'Cannot add comment to blocked users' });
    }

      // If it's a reply, add the comment ID to the replies array of the parent comment
      newComment = new Comment({ userId, objectId, desc, replyTo: parentComment });
      parentComment.replies.push(newComment._id);
      await parentComment.save();

      // Notify the owner of the parent comment about the reply
      const parentCommentOwner = await User.findById(parentComment.userId);
      if (parentCommentOwner) {
        const notificationMessage = `You have a reply on your comment: ${desc}   By ${userName.name}`;
        await createNotificationForOwner(userId, parentCommentOwner._id, notificationMessage);
      }
    }

    // Check if the objectId is a video
    const video = await Video.findById(objectId);
    if (video) {
      if (!replyTo) {
        // Only create a newComment if it's not a reply
        newComment = new Comment({ userId, objectId, desc, replyTo: parentComment });
      }

      // Save the new comment
      const savedComment = await newComment.save();

      // Notify the owner of the commented video
      const notificationMessage = replyTo
        ? `You have a reply on your comment: ${desc}   By ${userName.name}`
        : `New comment on your video: ${desc}   By ${userName.name}`;

      await createNotificationForOwner(userId, video.userId, notificationMessage);

      return res.status(200).json(savedComment);
    }

    // Check if the objectId is a post
    const post = await Post.findById(objectId);
    if (post) {
      if (!replyTo) {
        // Only create a newComment if it's not a reply
        newComment = new Comment({ userId, objectId, desc, replyTo: parentComment });
      }

      // Save the new comment
      const savedComment = await newComment.save();

      // Notify the owner of the commented post
      const notificationMessage = replyTo
        ? `You have a reply on your comment: ${desc}   By ${userName.name}`
        : `New comment on your post: ${desc}   By ${userName.name}`;

      await createNotificationForOwner(userId, post.userId, notificationMessage);

      return res.status(200).json(savedComment);
    }

    // If objectId doesn't match any existing post or video
    return next(createError(404, 'Associated post or video not found'));
  } catch (err) {
    next(err);
  }
};




export const deleteComment = async (req, res, next) => {
  try {
    const commentId = req.params.id;
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return next(createError(404, 'Comment not found'));
    }

   
    // Check if the user is authorized to delete the comment
    if (String(comment.userId) !== String(req.user.id)) {
      return next(createError(403, 'You are Can Delete Only Your Comment  '));
    }

    await Comment.findByIdAndDelete(commentId);
    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (err) {
    next(err);
  }
};

//for Appeares Comments Under video



export const getCommentsByObjectId = async (req, res, next) => {
  try {
    const comments = await Comment.find({ objectId: req.params.objectId });
    if (!comments || comments.length === 0) {
      return next(createError(404, 'No comments found for the specified objectId'));
    }
    res.status(200).json(comments);
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

