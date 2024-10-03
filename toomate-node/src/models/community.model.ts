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

    // New Fields
    tags: {
      type: [String], // Flexible list of tags like ["Woodworking", "Painting", "Electronics"]
      index: true,    // Ensure efficient tag-based searches
    },
    location: {
      city: String,
      country: String,
    },
    sponsored: {
      type: Boolean,
      default: false,
    },
    badges: {
      type: [String], // Example badges: ["Top Community", "Innovative Projects"]
    },
    milestones: {
      type: [String], // Example milestones: ["100 Members", "1000 Posts"]
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
