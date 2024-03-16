// models/Comment.js
import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  objectId: { type: mongoose.Schema.Types.ObjectId, required: true },
  desc: { type: String, required: true },
  replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }] // Array of reply comment IDs
});

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
