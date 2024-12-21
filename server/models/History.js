// models/History.js
import mongoose from 'mongoose';

const historySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true }, // Action performed
  timestamp: { type: Date, default: Date.now } // Timestamp of the action
});

const History = mongoose.model('History', historySchema);

export default History;
