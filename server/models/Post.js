import mongoose from 'mongoose';

const { Schema } = mongoose;

const postSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  desc: {
    type: String,
    required: true,
  },
  imgUrl: {
    type: String,
    required: true,
  },
  videoUrl: {
    type: String,
  }, 
 
 
  tags: {
    type: [String],
    default: [],
  },
  likes: {
    type: [String],
    default: [],
  },
  dislikes: {
    type: [String],
    default: [],
  },
  postKey: {
    type: String,
    required: true,
    unique: true, // Ensure no duplicate keys
  }, 
   comments: [{ // إضافة حقل التعليقات
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Comment', // ربط التعليقات بموديل "Comment"
      }],
},
{ timestamps: true }
);
const Post = mongoose.model('Post', postSchema);

export default Post;
