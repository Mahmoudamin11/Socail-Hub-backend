import User from "../models/User.js";
import Video from "../models/Video.js";
import { createError } from "../error.js";
import View from '../models/View.js';
import { createNotificationsForSubscribersOrFollowers } from '../controllers/notification.js';
import { addHistory } from '../controllers/historyController.js'; // Import the function to add history entries
import { encrypt } from './bycripting_algorithem.js'; // استدعاء ملف التشفير






export const addVideo = async (req, res, next) => {
  try {
    // العثور على المستخدم
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(createError(404, "User not found"));
    }

    // إنشاء النص الأساسي لتشفير videoKey
    const uniqueIdentifier = `${req.user.id}-${Date.now()}-${Math.random()}`;
    const appName = "Social_Hub";

    // تشفير videoKey باستخدام الوظيفة المستدعاة
    const videoKey = `${encrypt(uniqueIdentifier)}-${appName}`;

    // إنشاء فيديو جديد
    const newVideo = new Video({
      userId: req.user.id,
      videoKey,
      ...req.body,
    });

    // حفظ الفيديو الجديد
    const savedVideo = await newVideo.save();

    // إنشاء رسالة إشعار
    const message = `New video added: ${savedVideo.title} Link: ${savedVideo.videoUrl} --->>> By ${user.name}`;

    // إنشاء الإشعارات للمشتركين أو المتابعين
    await createNotificationsForSubscribersOrFollowers(req.user.id, message);

    // إضافة سجل النشاط
    await addHistory(req.user.id, `You added a new video: ${savedVideo.title}`);

    // استجابة النجاح
    res.status(200).json(savedVideo);
  } catch (err) {
    console.error('Error adding video:', err.message);
    next(err);
  }
};


export const updateVideo = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(createError(404, "User not found"));
    }
    // Find the video by ID
    const video = await Video.findById(req.params.id);
    if (!video) return next(createError(404, "Video not found!"));

    // Check if the user is the owner of the video
    if (req.user.id === video.userId) {
      // Update the video
      const updatedVideo = await Video.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true }
      );

      // Create notifications for subscribers or followers
      await createNotificationsForSubscribersOrFollowers(
        req.user.id,
        `Video updated: ${updatedVideo.title} - ${updatedVideo.videoUrl} By (${user.name})`
      );

      // Respond with the updated video
      res.status(200).json(updatedVideo);
    } else {
      // If the user is not the owner of the video, return a 403 error
      return next(createError(403, "You can update only your video!"));
    }
  } catch (err) {
    // Pass any errors to the error handler middleware
    next(err);
  }
};


export const deleteVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return next(createError(404, "Video not found!"));
    if (req.user.id === video.userId) {
      await Video.findByIdAndDelete(req.params.id);
      await addHistory(req.user.id, `You Delete Video : ${video.title}" `);

      res.status(200).json("The video has been deleted.");
    } else {
      return next(createError(403, "You can delete only your video!"));
    }
  } catch (err) {
    next(err);
  }
};

export const getVideosByUser = async (req, res, next) => {
  try {
    const { userId } = req.params; // Extract userId from the URL
    console.log("Fetching videos for userId:", userId); // Debugging log

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const videos = await Video.find({ userId });

    if (!videos.length) {
      return res.status(404).json({ success: false, message: "No videos found for this user." });
    }

    res.status(200).json({ success: true, videos });
  } catch (err) {
    console.error("Error fetching videos:", err.message); // Log the error
    next(err);
  }
};






export const addView = async (req, res, next) => {
  try {
    const videoId = req.params.id;
    const userId = req.user.id; // Assuming req.user.id contains the unique identifier of the viewer

    // Check if the user has already viewed this video
    const existingView = await View.findOne({ videoId, userId });

    if (!existingView) {
      // Record the view
      await View.create({ videoId, userId });
      
      // Increment the view count for the video
      await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });

      res.status(200).json("The view has been increased.");
    } else {
      res.status(400).json("You have already viewed this video.");
    }
  } catch (err) {
    next(err);
  }
};
















export const random = async (req, res, next) => {
  try {
    const videos = await Video.aggregate([{ $sample: { size: 40 } }]);
    res.status(200).json(videos);
  } catch (err) {
    next(err);
  }
};

export const trend = async (req, res, next) => {
  try {
    const videos = await Video.find().sort({ views: -1 });
    res.status(200).json(videos);
  } catch (err) {
    next(err);
  }
};

export const sub = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const subscribedChannels = user.SubscriberedOrFollowed;

    const list = await Promise.all(
      subscribedChannels.map(async (channelId) => {
        return await Video.find({ userId: channelId });
      })
    );  

    res.status(200).json(list.flat().sort((a, b) => b.createdAt - a.createdAt));
  } catch (err) {
    next(err);
  }
};





export const FindAllUsers = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    const subscribedChannels = user.subscribedUsers;

    const list = await Promise.all(
      subscribedChannels.map(async (channelId) => {
        return await Video.find({ userId: channelId });
      })
    );

    res.status(200).json(list.flat().sort((a, b) => b.createdAt - a.createdAt));
  } catch (err) {
    next(err);
  }
};

export const getByTag = async (req, res, next) => {
  try {
      const { tagQuery } = req.query;

      if (!tagQuery) {
          return res.status(400).json({ success: false, message: 'Tag query is required' });
      }

      // Perform a query to find videos with tags that partially match the query
      const regex = new RegExp(tagQuery, 'i'); // Case-insensitive regex matching
      const videos = await Video.find({ tags: { $regex: regex } });

      if (videos.length === 0) {
          return res.status(404).json({ success: false, message: 'No matching videos found' });
      }

      res.json({ success: true, videos });
  } catch (error) {
      console.error('Error searching for videos by tag:', error);
      res.status(500).json({ success: false, message: 'Error searching for videos by tag' });
  }
};





export const search = async (req, res, next) => {
  const query = req.query.q;
  try {
    const videos = await Video.find({
      title: { $regex: query, $options: "i" },
    }).limit(40);
    res.status(200).json(videos);
  } catch (err) {
    next(err);
  }
};



export const saveVideo = async (req, res, next) => {
  const userId = req.user.id;
  const videoId = req.params.id;
  const video = await Video.findById(videoId);

  try {
    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return next(createError(404, "User not found"));
    }

    // Check if user.savedVideos is defined
    if (!user.savedVideos) {
      console.error("User savedVideos array is undefined");
      return next(createError(500, "User savedVideos array is undefined"));
    }

    // Check if the video is already saved
    if (user.savedVideos.includes(videoId)) {
      return res.status(400).json({ success: false, message: "Video already saved" });
    }

    // Add the video ID to the user's savedVideos array
    user.savedVideos.push(videoId);
    await user.save();
    await addHistory(req.user.id, `You Save Video : ${video.title}" `);

    res.status(200).json({ success: true, message: "Video saved successfully" });
  } catch (err) {
    next(err);
  }
};


export const unsaveVideo = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return next(createError(404, "User not found!"));

    // Check if video exists
    const video = await Video.findById(req.params.id);
    if (!video) return next(createError(404, "Video not found!"));

    // Check if the video is saved
    const isSaved = user.savedVideos.includes(req.params.id);
    if (!isSaved) return next(createError(400, "Video is not saved!"));

    // Remove the video from saved list
    user.savedVideos = user.savedVideos.filter(id => id !== req.params.id);
    await user.save();
    await addHistory(req.user.id, `You Unsave Video : ${video.title}" `);

    res.status(200).json({ message: "Video unsaved successfully." });
  } catch (err) {
    next(err);
  }
};




export const copyUrl = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return next(createError(404, "Video not found"));
    }
    
    // Extract the video URL
    const videoUrl = video.videoUrl;

    res.status(200).json({ success: true, videoUrl });
  } catch (err) {
    next(err);
  }
};







export const uploadVideo = async (req, res) => {
  try {
      const videoFile = req.file;
      if (!videoFile) {
          return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const newVideo = new Video({
          userId: req.body.userId,
          title: req.body.title,
          description: req.body.description,
          videoUrl: videoFile.path,
          thumbnailUrl: req.body.thumbnailUrl,
          tags: req.body.tags,
      });

      await newVideo.save();
      await addHistory(req.user.id, `You Uploded Video : ${newVideo.title}" `);

      res.status(200).json({ success: true, message: 'Video uploaded successfully', video: newVideo });
  } catch (error) {
      console.error('Error uploading video:', error); // Log the error for debugging
      res.status(500).json({ success: false, message: 'Error uploading video' });
  }
};






// Helper function to check if a user is blocked
const isUserBlocked = async (senderId, receiverId) => {
  try {
    const sender = await User.findById(senderId);
    return sender ? sender.blockedUsers.includes(receiverId) : false;
  } catch (error) {
    console.error('Error checking if user is blocked:', error);
    return false;
  }
};



