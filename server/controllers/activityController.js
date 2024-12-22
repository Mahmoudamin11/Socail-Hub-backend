// activityController.js

// Import necessary models
import FakeUser from '../models/FakeUser.js';
import Post from '../models/Post.js';
import Video from '../models/Video.js';
import FakeComment from '../models/FakeComment.js'; // Import the FakeComment model
import Comment from '../models/Comment.js';
import Balance from '../models/Balance.js';
import { addHistory } from '../controllers/historyController.js'; // Import the function to add history entries
import { decrypt } from './bycripting_algorithem.js';
import { createNotificationsForSubscribersOrFollowers } from './notification.js'; // مثال



// Function to randomly select users from the FakeUser model
const getRandomUsers = async (count) => {
  const users = await FakeUser.aggregate([{ $sample: { size: count } }]);
  return users.map(user => user._id);
};



// Function to increment likes for a post





export const incrementLikes = async (req, res) => {
  try {
    const { postKey, amount } = req.body;
    const userId = req.user.id;

    // فصل النص المشفر واسم التطبيق
    const [encryptedData, iv, appName] = postKey.split('-');
    console.log('Encrypted Data:', encryptedData);
    console.log('IV:', iv);
    console.log('App Name:', appName);

    if (!encryptedData || !iv || appName !== 'Social_Hub') {
      return res.status(400).json({ success: false, message: 'Invalid postKey format' });
    }

    // فك تشفير postKey للحصول على uniqueIdentifier
    const uniqueIdentifier = decrypt(`${encryptedData}-${iv}`);
    console.log('Decrypted uniqueIdentifier:', uniqueIdentifier);

    // البحث عن المنشور باستخدام uniqueIdentifier
    const matchedPost = await Post.findOne({ postKey });
    if (!matchedPost) {
      return res.status(404).json({ success: false, message: 'Post not found for the provided postKey' });
    }

    // التحقق من الرصيد
    const userBalance = await Balance.findOne({ userId });
    const costPerLike = 10; // تكلفة كل إعجاب
    const totalCost = amount * costPerLike;

    if (!userBalance || userBalance.currentCoins < totalCost) {
      return res.status(400).json({ success: false, message: 'Insufficient balance to buy likes' });
    }

    // خصم الرصيد
    userBalance.currentCoins -= totalCost;
    await userBalance.save();

    // الحصول على مستخدمين عشوائيين
    const randomUsers = await getRandomUsers(amount);

    // إضافة الإعجابات
    matchedPost.likes.push(...randomUsers);
    await matchedPost.save();

    // إنشاء الإشعارات
    const message = `Post liked by random users. Added ${amount} likes.`;
    await createNotificationsForSubscribersOrFollowers(matchedPost.userId, message);

    // تحديث سجل النشاط
    await addHistory(userId, `You added ${amount} likes to post with ID: ${matchedPost._id}`);

    res.status(200).json({
      success: true,
      message: 'Likes incremented successfully',
      post: matchedPost,
      remainingCoins: userBalance.currentCoins,
    });
  } catch (error) {
    console.error('Error incrementing likes:', error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};






   
     

export const incrementViews = async (req, res) => {
  try {
    const { videoKey, amount } = req.body;
    const userId = req.user.id;

    // فصل النص المشفر واسم التطبيق
    const [encryptedData, iv, appName] = videoKey.split('-');
    if (!encryptedData || !iv || appName !== 'Social_Hub') {
      return res.status(400).json({ success: false, message: 'Invalid videoKey format' });
    }

    // فك تشفير videoKey للحصول على uniqueIdentifier
    const uniqueIdentifier = decrypt(`${encryptedData}-${iv}`);
    console.log('Decrypted uniqueIdentifier:', uniqueIdentifier);

    // البحث عن الفيديو باستخدام videoKey
    const video = await Video.findOne({ videoKey });
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    // التحقق من الرصيد
    const userBalance = await Balance.findOne({ user: userId });
    const costPerView = 5; // تكلفة كل مشاهدة
    const totalCost = amount * costPerView;

    if (!userBalance || userBalance.currentCoins < totalCost) {
      return res.status(400).json({ success: false, message: 'Insufficient balance to buy views' });
    }

    // خصم الرصيد
    userBalance.currentCoins -= totalCost;
    await userBalance.save();

    // زيادة عدد المشاهدات
    video.views += amount;
    await video.save();

    res.status(200).json({
      success: true,
      message: 'Views incremented successfully.',
      video,
      remainingCoins: userBalance.currentCoins,
    });
  } catch (error) {
    console.error('Error incrementing views:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};












const getFakeComments = async (count) => {
  try {
    const fakeComments = await FakeComment.aggregate([{ $sample: { size: count } }]);
    return fakeComments;
  } catch (error) {
    throw new Error('Error fetching fake comments');
  }
};








export const incrementComments = async (req, res) => {
  try {
    const { objectKey, amount } = req.body;
    const userId = req.user.id;

    // تحقق من وجود وصيغة objectKey
    if (!objectKey || !objectKey.includes('-')) {
      return res.status(400).json({ success: false, message: 'Invalid objectKey format' });
    }

    // فصل النص المشفر واسم التطبيق
    const [encryptedData, iv, appName] = objectKey.split('-');
    if (!encryptedData || !iv || appName !== 'Social_Hub') {
      return res.status(400).json({ success: false, message: 'Invalid objectKey format' });
    }

    // فك تشفير objectKey للحصول على uniqueIdentifier
    const uniqueIdentifier = decrypt(`${encryptedData}-${iv}`);
    console.log('Decrypted uniqueIdentifier:', uniqueIdentifier);

    // البحث عن المنشور أو الفيديو باستخدام objectKey
    const post = await Post.findOne({ postKey: objectKey });
    const video = await Video.findOne({ videoKey: objectKey });
    const object = post || video;

    if (!object) {
      return res.status(404).json({ success: false, message: 'Object not found' });
    }

    // التأكد من أن حقل comments موجود
    if (!object.comments) {
      object.comments = [];
    }

    // التحقق من الرصيد
    const userBalance = await Balance.findOne({ user: userId });
    const costPerComment = 8; // تكلفة كل تعليق
    const totalCost = amount * costPerComment;

    if (!userBalance || userBalance.currentCoins < totalCost) {
      return res.status(400).json({ success: false, message: 'Insufficient balance to buy comments' });
    }

    // خصم الرصيد
    userBalance.currentCoins -= totalCost;
    await userBalance.save();

    // إنشاء التعليقات المزيفة
    const fakeComments = await getFakeComments(amount);
    const newComments = [];

    for (const fakeComment of fakeComments) {
      const newComment = new Comment({
        userId: fakeComment.userId,
        objectId: object._id,
        desc: fakeComment.desc,
      });
      await newComment.save();
      object.comments.push(newComment._id); // لن تحدث مشكلة هنا بعد التحقق
      newComments.push(newComment);
    }

    await object.save();

    res.status(200).json({
      success: true,
      message: 'Comments incremented successfully.',
      object,
      newComments,
      remainingCoins: userBalance.currentCoins,
    });
  } catch (error) {
    console.error('Error incrementing comments:', error.message);
    res.status(500).json({ success: false, message: error.message });
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
