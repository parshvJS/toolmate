import mongoose from 'mongoose';


// for managing each chat from user info specific community
const CommunityChatSchema = new mongoose.Schema(
  {
    communityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      default: ' ',
    },
    fileUrls: {
      type: [String], // Array of file URLs
    },
    previewUrls: {
      type: [String], // Array of preview image URLs
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const CommunityChat = mongoose.model('CommunityChat', CommunityChatSchema);
