// server/models/Chat.js
import mongoose from 'mongoose';

const ChatSchema = new mongoose.Schema({
    userMessage: {
        type: String,
        required: true,
    },
    botResponse: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

const Chat = mongoose.model('Chat', ChatSchema);
export default Chat;
