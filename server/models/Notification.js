import mongoose from 'mongoose';
const notificationSchema = new mongoose.Schema({
    FROM: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    TO: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    FROM_SYS: {
        type: String, // Change the type to String
        required: false,
    },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false }, // New field to track if notification is read

}, { timestamps: true });











const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
