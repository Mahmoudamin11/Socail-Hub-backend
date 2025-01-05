// models/Comment.js
import mongoose from 'mongoose';
const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  objectId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Associated post or video ID
  desc: { type: String, required: true },
  category: { type: String, default: "General" }, // New category field
  replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }], // Array of reply comment IDs
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null }, // Parent comment (if reply)
});

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;
