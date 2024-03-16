import mongoose from 'mongoose';

const PremiumPlanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    planType: {
      type: String,
      enum: ['business', 'vip', 'superVIP'],
      required: true,
    },
    subscriptionDate: {
      type: Date,
      default: Date.now,
    },
    expirationDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model('PremiumPlan', PremiumPlanSchema);
