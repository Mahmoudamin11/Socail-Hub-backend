import { createError } from "../error.js";
import Comment from "../models/Comment.js";
import Video from "../models/Video.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import FakeComment from '../models/FakeComment.js'; // Import the FakeComment model
import { addHistory } from '../controllers/historyController.js'; // Import the function to add history entries

import { createNotificationForOwner } from './notification.js'; // Assuming you have the notification functions in a separate file

export const addComment = async (req, res, next) => {
  const { objectId, desc, category } = req.body; // Require objectId, desc, and optional category
  const userId = req.user.id;

  try {
      // Validate if the objectId corresponds to a video or a post
      const video = await Video.findById(objectId);
      const post = await Post.findById(objectId);

      // If objectId is not valid for a video or post, return an error
      if (!video && !post) {
          return res.status(400).json({
              success: false,
              message: "Invalid objectId. Comments can only be added to valid videos or posts.",
          });
      }

      // Create a new root comment
      const newComment = new Comment({
          userId,
          objectId,
          desc,
          replies: [], // Initialize with an empty replies array
          category: "root", // Explicitly set the category to "root"
      });

      const savedComment = await newComment.save();

      if (video) {
          video.comments.push(savedComment._id);
          await video.save();

          await addHistory(userId, `You added a comment on video: "${video.title}"`);
          const notificationMessage = `New comment on your video: "${desc}"`;
          await createNotificationForOwner(userId, video.userId, notificationMessage);

          return res.status(200).json({
              success: true,
              message: "Comment added to video successfully.",
              comment: savedComment,
          });
      }

      if (post) {
          post.comments.push(savedComment._id);
          await post.save();

          await addHistory(userId, `You added a comment on post: "${post.title}"`);
          const notificationMessage = `New comment on your post: "${desc}"`;
          await createNotificationForOwner(userId, post.userId, notificationMessage);
s
          return res.status(200).json({
              success: true,
              message: "Comment added to post successfully.",
              comment: savedComment,
          });
      }
  } catch (err) {
      console.error("Error adding comment:", err);
      next(err);
  } 
};









export const addReply = async (req, res, next) => {
  const { commentId, desc } = req.body; // Require commentId and reply description
  const userId = req.user.id;

  try {
    // Find the comment being replied to
    const parentComment = await Comment.findById(commentId);
    if (!parentComment) {
      return res.status(404).json({ success: false, message: "Parent comment not found" });
    }

    // Check if the user being replied to is blocked
    const receiverId = parentComment.userId;
    const isReceiverBlocked = await isUserBlocked(userId, receiverId);
    if (isReceiverBlocked) {
      return res.status(403).json({ success: false, message: "Cannot reply to blocked users" });
    }

    // Create a new reply
    const newReply = new Comment({
      userId,
      objectId: parentComment.objectId, // Keep the same objectId
      desc,
      replies: [], // Initialize with an empty array for nested replies
      replyTo: parentComment._id, // Link to the parent comment
    });

    const savedReply = await newReply.save();

    // Determine if the parent comment is a root or nested reply
    if (!parentComment.replyTo) {
      // Parent is a root comment
      parentComment.replies.push(savedReply._id);
      await parentComment.save();
    } else {
      // Parent is a nested reply
      // Find the root comment
      let rootComment = parentComment;
      while (rootComment.replyTo) {
        rootComment = await Comment.findById(rootComment.replyTo);
        if (!rootComment) {
          return res.status(404).json({ success: false, message: "Root comment not found" });
        }
      }

      // Add reply to the parent and root comment
      parentComment.replies.push(savedReply._id);
      await parentComment.save();

      rootComment.replies.push(savedReply._id);
      await rootComment.save();
    }

    // Notify the owner of the parent comment
    const parentCommentOwner = await User.findById(parentComment.userId);
    if (parentCommentOwner) {
      const notificationMessage = `${req.user.name} replied to your comment: "${desc}"`;
      await createNotificationForOwner(userId, parentCommentOwner._id, notificationMessage);
    }

    // Add history for the user making the reply
    await addHistory(userId, `You replied to a comment: "${desc}"`);

    return res.status(200).json({
      success: true,
      message: "Reply added successfully.",
      reply: savedReply,
    });
  } catch (err) {
    console.error("Error adding reply:", err);
    next(err);
  }
};




export const getReplies = async (req, res, next) => {
  const { commentId } = req.params;

  try {
    // Find the root comment and populate replies, user details, and replyTo
    const rootComment = await Comment.findById(commentId)
      .populate({
        path: 'replies',
        populate: [
          {
            path: 'userId',
            select: 'name profilePicture',
          },
          {
            path: 'replies',
            populate: [
              {
                path: 'userId',
                select: 'name profilePicture',
              },
              {
                path: 'replyTo',
                populate: {
                  path: 'userId',
                  select: 'name',
                },
              },
            ],
          },
          {
            path: 'replyTo',
            populate: {
              path: 'userId',
              select: 'name',
            },
          },
        ],
      })
      .populate({
        path: 'userId',
        select: 'name profilePicture',
      })
      .lean(); // Convert the rootComment to a plain object

    if (!rootComment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    // Transform the user data
    const transformUser = (user) => ({
      name: user.name,
      profilePicture: user.profilePicture,
    });

    // Transform replies
    const transformReplies = (replies) =>
      replies.map((reply) => ({
        ...reply,
        desc: reply.desc, // Include the description/content of the reply
        user: reply.userId ? transformUser(reply.userId) : null,
        replyTo: reply.replyTo
          ? {
              name: reply.replyTo.userId?.name || null, // Include the name of the user being replied to
            }
          : null,
        replies: transformReplies(reply.replies || []),
      }));

    return res.status(200).json({
      success: true,
      message: "Replies fetched successfully.",
      commentId: rootComment._id,
      rootUser: rootComment.userId ? transformUser(rootComment.userId) : null,
      replies: rootComment.replies?.length > 0 ? transformReplies(rootComment.replies) : [], // Return empty array if no replies
    });
  } catch (err) {
    console.error("Error fetching replies:", err);
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
          return next(createError(403, 'You can only delete your own comment.'));
      }

      // Delete the comment from the Comment database
      await Comment.findByIdAndDelete(commentId);

      // Remove the comment reference from the associated video or post
      const video = await Video.findById(comment.objectId);
      if (video) {
          video.comments = video.comments.filter(id => String(id) !== commentId);
          await video.save();
      } else {
          const post = await Post.findById(comment.objectId);
          if (post) {
              post.comments = post.comments.filter(id => String(id) !== commentId);
              await post.save();
          }
      }

      // Add a history entry for the deletion
      await addHistory(req.user.id, `You deleted a comment: "${comment.desc}"`);

      res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (err) {
      next(err);
  }
};

//for Appeares Comments Under video
 









export const getCommentsByObjectId = async (req, res, next) => {
  try {
    // Fetch comments for the specified objectId with category "root"
    const comments = await Comment.find({ objectId: req.params.objectId, category: "root" })
      .populate({
        path: 'userId', // Assuming the field that links to the user is 'userId'
        select: 'name profilePicture', // Only include name and profilePicture from User
      });

    // Return an empty array if no comments are found
    if (!comments || comments.length === 0) {
      return res.status(200).json([]);
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

