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
      required: true,
    },
    profileImageParams: {
      type: String,
      required: true,
    },
    bannerImageParams: {
      type: String,
      required: true,
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
      default: [],
    },
    city: {
      type: String,
      default: '',
    },
    country: {
      type: String,
      default: '',
    },
    sponsored: {
      type: Boolean,
      default: false,
    },
    badges: {
      type: [String],
      default: [],
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
