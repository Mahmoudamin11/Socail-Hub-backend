import { createError } from "../error.js";
import Comment from "../models/Comment.js";
import Video from "../models/Video.js";
import Post from "../models/Post.js";

export const addComment = async (req, res, next) => {
  const { objectId, desc } = req.body;
  const userId = req.user.id;

  try {
    // Check if the objectId is a video
    const video = await Video.findById(objectId);
    if (video) {
      const newComment = new Comment({ userId, objectId, desc });
      const savedComment = await newComment.save();
      return res.status(200).json(savedComment);
    }

    // Check if the objectId is a post
    const post = await Post.findById(objectId);
    if (post) {
      const newComment = new Comment({ userId, objectId, desc });
      const savedComment = await newComment.save();
      return res.status(200).json(savedComment);
    }

    // If objectId doesn't match any existing post or video
    return next(createError(404, "Associated post or video not found"));
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
    if (comment.userId !== req.user.id) {
      return next(createError(403, 'You are not authorized to delete this comment'));
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
