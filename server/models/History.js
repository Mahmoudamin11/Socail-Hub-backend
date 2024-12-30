import mongoose from 'mongoose';

const historySchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    }, // Reference to the User
    action: { 
      type: String, 
      required: true 
    }, // Description of the action
    metadata: { 
      type: mongoose.Schema.Types.Mixed, 
      default: {} 
    }, // Additional optional data related to the action
    timestamp: { 
      type: Date, 
      default: Date.now 
    } // Timestamp of the action
  },
  { timestamps: true } // Automatically manage createdAt and updatedAt fields
);

const History = mongoose.model('History', historySchema);

export default History;
