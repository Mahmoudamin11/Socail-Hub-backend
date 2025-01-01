import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    videoUrl: {
        type: String,
        required: true,
    },
    thumbnailUrl: {
        type: String,
        required: true,
    },
    views: {
        type: Number,
        default: 0,
    },
    tags: {
        type: [String],
        default: [],
        required: true,
    },
    likes: {
        type: [String],
        default: [],
    },
    dislikes: {
        type: [String],
        default: [],
    }, owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      
      ownerName: String, // اسم صاحب الفيديو
      ownerProfilePicture: String, // صورة بروفايل صاحب الفيديو
    videoKey: {
        type: String,
        required: true,
        unique: true, // Ensure no duplicate keys
    },
    comments: [{ // إضافة حقل التعليقات
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment', // ربط التعليقات بموديل "Comment"
    }],
}, { timestamps: true });

const Video = mongoose.model('Video', videoSchema);

export default Video;

