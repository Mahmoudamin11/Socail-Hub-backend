import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true, // The user who made the report
    },
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true, // The user being reported
    },
    content: {
      type: String,
      required: true, // The reported content (e.g., a message, comment, etc.)
    },
    contentType: {
      type: String,
      enum: ['message', 'comment'], // Type of content being reported
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'dismissed'], // Status of the report
      default: 'pending',
    },
    reason: {
      type: String, // Reason for the report (e.g., "violence", "spam", etc.)
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now, // Timestamp for when the report was created
    },
    updatedAt: {
      type: Date, // Timestamp for when the report was last updated
    },
  },
  { timestamps: true } // Automatically add createdAt and updatedAt
);

const Report = mongoose.model('Report', reportSchema);

export default Report;
