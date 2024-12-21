// models/balanceModel.js

import mongoose from 'mongoose';

const BalanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    currentCoins: {
      type: Number,
      default: 35 ,
    }, 
    lastUpdated: {
      type: Date,
      default: null, // حقل لتسجيل آخر وقت تم فيه التحديث
    },
  },
  { timestamps: true }
);

export default mongoose.model('Balance', BalanceSchema);
