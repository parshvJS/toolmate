import mongoose from 'mongoose';

// Model for each new community
const CommunitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    memberCount: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
    },
    profileImage: {
      type: String,
    },
    bannerImage: {
      type: String,
    },
    batch: {
      type: String,
      enum: ['Most Active', 'New Community'],
      default: 'New Community',
    },
    memberList: {
      type: [String], // Array of user IDs
    },
  },
  { timestamps: true }
);

export const Community = mongoose.model('Community', CommunitySchema);
