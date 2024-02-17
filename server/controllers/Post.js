import Post from "../models/Post.js";
import { createError } from "../error.js";
import User from "../models/User.js";

export const addPost = async (req, res, next) => {
  const newPost = new Post({ userId: req.user.id, ...req.body });
  try {
    const savedPost = await newPost.save();
    res.status(200).json(savedPost);
  } catch (err) {
    next(err);
  }
};

export const updatePost = async (req, res, next) => {
  try {
    const founded = await Post.findById(req.params.id);
    if (!founded) return next(createError(404, "Post not found!"));
    if (req.user.id === founded.userId) {
      const updatedPost = await Post.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true }
      );
      res.status(200).json(updatedPost);
    } else {
      return next(createError(403, "You can update only your Post!"));
    }
  } catch (err) {
    next(err);
  }
};

export const deletePost = async (req, res, next) => {
  try {
    const founded = await Post.findById(req.params.id);
    if (!founded) return next(createError(404, "Post not found!"));
    if (req.user.id === founded.userId) {
      await Post.findByIdAndDelete(req.params.id);
      res.status(200).json("The Post has been deleted.");
    } else {
      return next(createError(403, "You can delete only your Post!"));
    }
  } catch (err) {
    next(err);
  }
};

export const getPostsById = async (req, res, next) => {
  const userId = req.params.id;
  
  try {
    const posts = await Post.find({ userId });
    res.status(200).json(posts);
  } catch (err) {
    next(err);
  }
};


export const random = async (req, res, next) => {
  try {
    const posts = await Post.aggregate([{ $sample: { size: 40 } }]);
    res.status(200).json(posts);
  } catch (err) {
    next(err);
  }
};



export const MatualFrind = async (req, res, next) => {
  try {
    // Retrieve the list of subscribed channels from the user's document
    const user = await User.findById(req.user.id);
    const subscribedChannels = user.subscriptions_Channels;

    // Find all posts where the userId matches any of the subscribed channels
    const posts = await Post.find({ userId: { $in: subscribedChannels } })
                             .sort({ createdAt: -1 }); // Sort by createdAt in descending order

    // Send the list of posts as the response
    res.status(200).json(posts);
  } catch (err) {
    // Handle errors
    next(err);
  }
};










export const likePost = async (req, res, next) => {
  const userId = req.user.id;
  const postId = req.params.id;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return next(createError(404, "Post not found"));
    }

    // Check if the user has already liked the post
    if (post.likes.includes(userId)) {
      return res.status(400).json({ error: "You have already liked this post" });
    }

    // Remove user from dislikes list if they are present
    if (post.dislikes.includes(userId)) {
      post.dislikes.pull(userId); // Remove user from dislikes list
    }

    // Update the post's likes array to include the user's ID
    post.likes.push(userId);
    await post.save();

    res.status(200).json({ message: "Post liked successfully" });
  } catch (err) {
    next(err);
  }
};

export const dislikePost = async (req, res, next) => {
  const userId = req.user.id;
  const postId = req.params.id;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return next(createError(404, "Post not found"));
    }

    // Check if the user has already disliked the post
    if (post.dislikes.includes(userId)) {
      return res.status(400).json({ error: "You have already disliked this post" });
    }

    // Remove user from likes list if they are present
    if (post.likes.includes(userId)) {
      post.likes.pull(userId); // Remove user from likes list
    }

    // Update the post's dislikes array to include the user's ID
    post.dislikes.push(userId);
    await post.save();

    res.status(200).json({ message: "Post disliked successfully" });
  } catch (err) {
    next(err);
  }
};
