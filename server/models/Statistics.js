import mongoose from 'mongoose';

const statisticsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
});

const Statistics = mongoose.model('Statistics', statisticsSchema);

export default Statistics;
