import mongoose, { Document, Model } from "mongoose";

export interface User extends Document {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  clerkUserId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new mongoose.Schema({

  // clerk
  id: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString(),
    unique: true,
  },
  email: {
    type: String,
    required: [true, "Email is required!"],
    unique: true,
  },
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  imageUrl: {
    type: String,
  },
  clerkUserId: {
    type: String,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },


  // custom 
  status: {
    type: [String],
    default: "active" // can be [active,warned,suspended,blocked]
  },
  globalContext: {
    type: [String],
    default: [] // this will containt different memory for the particular user that can be used in creating next response for more personalized suggestions
  },
  toolInvetory: {
    type: [{
      toolId: String,
      count: Number
    }],
  },
  wishList: {
    type: [{
      toolId: String,
      count: Number
    }]
  }

});

const User: Model<User> = mongoose.model<User>('User', UserSchema);

export default User;
