import Community from '../models/Community.js';
import User from '../models/User.js';
import { createNotificationForUser, sendNotificationsToCommunityMembers,createNotificationForOwner } from './notification.js';
import Notification from '../models/Notification.js';



// Function to create a community
export const createCommunity = async (req, res) => {
    try {
      const { name } = req.body;
  
      // Check if the community already exists
      const existingCommunity = await Community.findOne({ name });
      if (existingCommunity) {
        return res.status(400).json({ message: 'Community with this name already exists' });
      }
  
      // Create the community
      const community = await Community.create({ name });
  
      // Make the user who created the community an admin
      const user = await User.findById(req.user.id);
      user.isAdmin = true;
      user.community = community.id;
      user.communities.push(community.id); // Add the community to user's communities
      await user.save();
  
      // Add the user to the community admins and members
      community.admins.push(req.user.id);
      community.members.push(req.user.id);
      await community.save();
  
      res.status(201).json({ community, message: 'Community created successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error' });
    }
  };
  
  // Function to send an invitation to a user
  export const sendInvitation = async (req, res) => {
      try {
          const { communityId, userId } = req.body;
  
          // Check if the user is already a member of the community
          const community = await Community.findById(communityId);
          if (community.members.includes(userId)) {
              return res.status(400).json({ message: 'User is already a member of the community' });
          }
  

            
    // Check if the receiver is blocked by the sender
    const isReceiverBlocked = await isUserBlocked(senderId, receiverId);

    if (isReceiverBlocked) {
      return res.status(403).json({ success: false, message: 'Cannot send invitation to blocked users' });
    }




          // Check if an invitation has already been sent to the user
          const user = await User.findById(userId);
          if (user.invitations.some(invitation => invitation.communityId && invitation.communityId.equals(communityId))) {
              return res.status(400).json({ message: 'Invitation already sent to this user' });
          }
  
          // Send the invitation
          user.invitations.push({ communityId, senderId: req.user.id, accepted: false }); // Include communityId in the invitation
          await user.save();
  
          // Create a notification for the user
          const invitationMessage = `${req.user.name} invited you to join the community "${community.name}"`;
          await createNotificationForUser(req.user.id, userId, invitationMessage);
  
          res.status(200).json({ message: 'Invitation sent successfully' });
      } catch (error) {
          console.error(error);
          res.status(500).json({ message: 'Server Error' });
      }
  };
  
  // Function to accept an invitation
export const acceptInvitation = async (req, res) => {
  try {
      const { communityId } = req.body;

      // Check if the user has received an invitation
      const user = await User.findById(req.user.id);

      // Ensure that user and user.invitations are defined
      if (!user || !user.invitations || !Array.isArray(user.invitations)) {
          return res.status(400).json({ message: 'Invalid user or invitations array' });
      }

      // Convert communityId to a string for accurate comparison
      const stringCommunityId = communityId.toString();

      // Find the invitation in the user's invitations array
      const invitationIndex = user.invitations.findIndex(invitation => {
          return invitation.communityId && invitation.communityId.toString() === stringCommunityId;
      });

      // If the invitation doesn't exist, return an error
      if (invitationIndex === -1) {
          return res.status(400).json({ message: 'No invitation received for this community' });
      }

      // Add the user to the community members
      const community = await Community.findById(communityId);
      community.members.push(req.user.id);
      await community.save();

      // Remove the invitation from the user's list
      user.invitations.splice(invitationIndex, 1);
      await user.save();

      // Notify the admin that the user accepted the invitation
      const adminNotificationMessage = `${user.name} accepted the invitation to join the community "${community.name}"`;
      await createNotificationForOwner(req.user.id, community.admins, adminNotificationMessage);

      // Send notifications to all community members about the new member
      await sendNotificationsToCommunityMembers(community.id, req.user.id);

      res.status(200).json({ message: 'Invitation accepted successfully' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error' });
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