// activityController.js

// Import necessary models
import FakeUser from '../models/FakeUser.js';
import Post from '../models/Post.js';
import Video from '../models/Video.js';
import FakeComment from '../models/FakeComment.js'; // Import the FakeComment model
import Comment from '../models/Comment.js';
import Balance from '../models/Balance.js';
import { addHistory } from '../controllers/historyController.js'; // Import the function to add history entries



// Function to randomly select users from the FakeUser model
const getRandomUsers = async (count) => {
  const users = await FakeUser.aggregate([{ $sample: { size: count } }]);
  return users.map(user => user._id);
};



// Function to increment likes for a post
export const incrementLikes = async (req, res) => {
  try {
      const { objectId, amount } = req.body;

      // Find the post and video separately
      const post = await Post.findById(objectId);
      const video = await Video.findById(objectId);
      const userId = req.user.id;



      // Check if user has enough coins to buy likes
      const userBalance = await Balance.findOne({ user: userId });
      if (!userBalance || userBalance.currentCoins < amount * 12) {
        throw new Error('Insufficient balance to buy likes');
      }
      // Check if either post or video exists
      if (post) {
          const likesCount = parseInt(amount);
          if (isNaN(likesCount) || likesCount <= 0) {
              throw new Error('Amount must be a positive integer');
          }
          const randomUsers = await getRandomUsers(likesCount);
          post.likes.push(...randomUsers);
          await post.save();
          await deductCoins(req.user.id, amount * 12); // Deduct coins after incrementing likes

          res.status(200).json({ success: true, message: 'Likes incremented successfully.', object: post });
      } else if (video) {
          const likesCount = parseInt(amount);
          if (isNaN(likesCount) || likesCount <= 0) {
              throw new Error('Amount must be a positive integer');
          }
          const randomUsers = await getRandomUsers(likesCount);
          video.likes.push(...randomUsers);
          await video.save();
          await deductCoins(req.user.id, amount * 12); // Deduct coins after incrementing likes

          res.status(200).json({ success: true, message: 'Likes incremented successfully.', object: video });
      } else {
          throw new Error('Object not found');
      }
  } catch (error) {
      console.error('Error incrementing likes:', error);
      res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};

  

// Function to increment views for a video
export const incrementViews = async (req, res) => {
  try {
    const { objectId, amount } = req.body;
    const video = await Video.findById(objectId);
    const userId = req.user.id;



    // Check if user has enough coins to buy likes
    const userBalance = await Balance.findOne({ user: userId });
    if (!userBalance || userBalance.currentCoins < amount * 12) {
      throw new Error('Insufficient balance to buy likes');
    }



    if (!video) throw new Error('Video not found');

    video.views += amount; // Increment views by 'amount'
    await video.save();
    await deductCoins(req.user.id, amount * 8); // Deduct coins after incrementing likes

    res.status(200).json({ success: true, message: 'Views incremented successfully.', video });
  } catch (error) {
    console.error('Error incrementing video views:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};











const getFakeComments = async (count) => {
  try {
      // Fetch fake comments from the FakeComment model
      const fakeComments = await FakeComment.aggregate([{ $sample: { size: count } }]);
      return fakeComments;
  } catch (error) {
      console.error('Error fetching fake comments:', error);
      throw error;
  }
};



// Function to increment comments for a post or video
export const incrementComments = async (req, res) => {
  try {
    const { objectId, amount } = req.body;

    // Determine if the object is a post or video based on its ID
    const post = await Post.findById(objectId);
    const video = await Video.findById(objectId);
    const userId = req.user.id;



    // Check if user has enough coins to buy likes
    const userBalance = await Balance.findOne({ user: userId });
    if (!userBalance || userBalance.currentCoins < amount * 12) {
      throw new Error('Insufficient balance to buy likes');
    }





    let object;
    if (post) {
      object = post;
    } else if (video) {
      object = video;
    } else {
      throw new Error('Object not found');
    }

    // Validate the amount parameter
    const parsedAmount = parseInt(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error('Amount must be a positive integer');
    }

    // Get fake comments from the FakeComment model
    const fakeComments = await getFakeComments(parsedAmount);

    // Ensure the object has a comments property
    if (!object.comments) {
      object.comments = [];
    }

    // Map fake comments to new Comment documents and push them to the object
    const newComments = [];
    for (const fakeComment of fakeComments) {
      const newComment = new Comment({
        userId: fakeComment.userId,
        objectId: objectId,
        desc: fakeComment.desc // Use 'desc' from fake comment instead of 'content'
      });
      await newComment.save();
      object.comments.push(newComment._id);
      newComments.push(newComment);
    }

    await object.save();
    await deductCoins(req.user.id, amount * 8); // Deduct coins after incrementing likes

    res.status(200).json({ success: true, message: 'Comments incremented successfully.', object, newComments });
  } catch (error) {
    console.error('Error incrementing comments:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};









// Function to deduct coins from user's balance
const deductCoins = async (userId, amount) => {
    try {
        // Find the user's balance
        const userBalance = await Balance.findOne({ user: userId });

        // If balance doesn't exist, throw an error
        if (!userBalance) {
            throw new Error('User balance not found');
        }

        // Deduct coins
        userBalance.currentCoins -= amount;
        await userBalance.save();
    } catch (error) {
        throw error;
    }
};
