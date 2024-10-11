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
    profileImageParams: {
      type: String,
    },
    bannerImageParams: {
      type: String,
    },
    batch: {
      type: String,
      default: 'New Community',
    },
    memberList: {
      type: [String],
    },
    tags: {
      type: [String],
      index: true,
    },
    city: {
      type: String,
    },
    country: {
      type: String,
    },
    sponsored: {
      type: Boolean,
      default: false,
    },
    badges: {
      type: [String],
    },
  },
  { timestamps: true }
);

// Create indexes to optimize performance
CommunitySchema.index({ tags: 1 });
CommunitySchema.index({ location: 1 });
CommunitySchema.index({ memberCount: -1 });
CommunitySchema.index({ createdAt: -1 });

export const Community = mongoose.model('Community', CommunitySchema);
