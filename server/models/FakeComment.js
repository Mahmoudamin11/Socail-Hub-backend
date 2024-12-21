// models/FakeComment.js
import mongoose from 'mongoose';

const fakeCommentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'FakeUser', required: true },
  objectId: { type: mongoose.Schema.Types.ObjectId, required: true }, // This will represent the ID of the post or video
  desc: { type: String, required: true },
  replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FakeComment' }] // Array of reply comment IDs
});

const FakeComment = mongoose.model('FakeComment', fakeCommentSchema);

export default FakeComment;
