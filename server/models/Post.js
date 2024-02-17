import mongoose from 'mongoose';

const { Schema } = mongoose;

const postSchema = new Schema({
  userId: {
    type: String,
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
},
{ timestamps: true }
);
const Post = mongoose.model('Post', postSchema);

export default Post;
