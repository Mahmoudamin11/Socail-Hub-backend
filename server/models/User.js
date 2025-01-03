import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      min: 3,
      max: 20,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      min: 6,
    },
    refreshToken: { type: String }, // Ensure this field exists

    tempOTP: { // حقل لتخزين رمز OTP
      type: String,
    },
    otpExpires: { // حقل لتخزين تاريخ صلاحية OTP
      type: Date,
    },
    img: {
      type: String,
    },
    SubscriberedOrFollowed: {
      type: [String],
    },
    SubscribersOrFollowers: {
      type: [String],
    },
    fromGoogle: {
      type: Boolean,
      default: false,
    },
    isAvatarImageSet: {
      type: Boolean,
      default: false,
    },
    profilePicture: {
      type: String,
      default: "",
    },
    coverPicture: {
      type: String,
      default: "",
    },
   
    savedPosts: [
      {
        _id: mongoose.Schema.Types.ObjectId, 
        title: String,                      
        desc: String,                      
        imgUrl: String,                     
        videoUrl: String,                   
        tags: [String],                     
        likes: [mongoose.Schema.Types.ObjectId], 
        dislikes: [mongoose.Schema.Types.ObjectId], 
        postKey: String,

        createdAt: Date,                    
        updatedAt: Date,                   
      },
    ],
  
    isAdmin: {
      type: Boolean,
      default: false,
    },
    desc: {
      type: String,
      max: 50,
    },
    city: {
      type: String,
      max: 50,
    },
    friendRequests: [
      {
        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        senderName: { // اسم المرسل
          type: String,
          default: "", // تأكد من أن الحقل مطلوب
        },
        senderImg: { // صورة المرسل
          type: String,
          default: "", // قيمة افتراضية
        },
        accepted: {
          type: Boolean,
          default: false,
        },
      },
    
    
    ],

    communities: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Community",
      },
    ],

    friends: [
      {
        friendId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        friendName: {
          type: String,
          required: true,
        },
        friendProfilePicture: {
          type: String,
          default: "",
        },
        mutualFriends: [
          {
            friendId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
            },
            friendName: {
              type: String,
            },
            friendProfilePicture: {
              type: String,
              default: "",
            },
          },
        ], // قائمة الأصدقاء المشتركين
      },
    ],
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    savedVideos: [
      {
        _id: mongoose.Schema.Types.ObjectId,
        title: String,
        description: String,
        videoUrl: String,
        thumbnailUrl: String,
        views: Number,
        tags: [String],
        likes: [mongoose.Schema.Types.ObjectId],
        dislikes: [mongoose.Schema.Types.ObjectId],
        createdAt: Date,
        updatedAt: Date,
      },
    ],


    invitations: [
      {
        communityId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Community",
        },
        senderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        accepted: {
          type: Boolean,
          default: false,
        },
      },
    ],

    avatarImage: {
      type: String,
      default: "",
    },
    from: {
      type: String,
      max: 50,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
