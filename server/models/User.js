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
    savedVideos: {
      type: [String],
      default: [],
    },
    savedPosts: {
      type: [String],
      default: [],
    },
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
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
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
