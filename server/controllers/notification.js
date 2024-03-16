import Notification from '../models/Notification.js';
import User from '../models/User.js';


import Community from '../models/Community.js';










export const getNotificationsByUserId = async (req, res) => {
    try {
        const userId = req.params.userId;
        const notifications = await Notification.find({ TO: userId }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};




// Function to send notifications to all community members when a new member joins
export const sendNotificationsToCommunityMembers = async (communityId, newMemberId) => {
    try {
        // Find the community
        const community = await Community.findById(communityId);

        // Ensure that the community and its members are defined
        if (!community || !community.members || community.members.length === 0) {
            return;
        }

        // Create a notification message for the new member
        const notificationMessage = `${await getUserFullName(newMemberId)} joined the community`;

        // Create a notification for each community member (excluding the new member)
        const notifications = community.members
            .filter(memberId => memberId.toString() !== newMemberId.toString())
            .map(memberId => ({
                message: notificationMessage,
                TO: memberId,
                FROM: newMemberId,
            }));

        // Insert the notifications into the database
        await Notification.insertMany(notifications);
    } catch (error) {
        console.error('Error sending community member notifications:', error);
    }
};

// Helper function to get the full name of a user by their ID
const getUserFullName = async (userId) => {
    try {
        const user = await User.findById(userId);
        return user ? user.name : '';
    } catch (error) {
        console.error('Error getting user full name:', error);
        return '';
    }
};




















// Function to create a notification
export const createNotificationsForSubscribersOrFollowers = async (userId, message) => {
    try {
        // Find the user who added the video
        const user = await User.findById(userId);
        if (!user) return;

        // Get the list of subscribers or followers
        const subscribersOrFollowers = user.SubscribersOrFollowers;
        if (!subscribersOrFollowers || subscribersOrFollowers.length === 0) return;

        // Create a notification for each subscriber or follower
        const notifications = subscribersOrFollowers.map(subscriberId => ({
            message,
            TO: subscriberId,
            FROM: userId
        }));

        // Insert the notifications into the database
        await Notification.insertMany(notifications);
    } catch (error) {
        console.error('Error creating notifications:', error);
    }
};


// Function to get notifications by user
export const getNotificationsByUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const createNotificationForOwner = async (loggedInUserId, ownerId, message) => {
    try {
        // Create a notification for the owner
        const notification = {
            message,
            TO: ownerId,  // Ensure that this line sets the TO field to the ownerId
            FROM: loggedInUserId,
        };

        // Insert the notification into the database
        await Notification.create(notification);
    } catch (error) {
        console.error('Error creating notification for owner:', error);
    }
};


export const createNotificationForUser = async (fromUserId, toUserId, message) => {
    try {
        // Create a notification for the user
        const notification = {
            message,
            FROM: fromUserId,
            TO: toUserId
        };

        // Insert the notification into the database
        await Notification.create(notification);
    } catch (error) {
        console.error('Error creating notification for user:', error);
    }
};




// Modify the function to accept only necessary parameters for creating a notification
export const createSystemNotificationForUser = async (toUserId, message) => {
    try {
        // Create a notification from the system
        const systemNotification = {
            message,
            FROM_SYS: 'system',  // Set the sender as 'system'
            TO: toUserId
        };

        // Insert the system notification into the database
        await Notification.create(systemNotification);
    } catch (error) {
        console.error('Error creating system notification for user:', error);
    }
};









