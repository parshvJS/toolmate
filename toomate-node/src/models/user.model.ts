import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUser extends Document {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  clerkUserId?: string;
  status: string[];
  toolInventory: { toolId: string; count: number }[];
  wishList: { toolId: string; count: number }[];
  bookmarked: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new mongoose.Schema<IUser>({
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
  status: {
    type: [String],
    default: ["active"], // can be [active, warned, suspended, blocked]
  },
  toolInventory: {
    type: [
      {
        toolId: { type: String, required: true },
        count: { type: Number, required: true },
      },
    ],
    default: [],
  },
  wishList: {
    type: [
      {
        toolId: { type: String, required: true },
        count: { type: Number, required: true },
      },
    ],
    default: [],
  },
  bookmarked: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UserChat' }],
    default: [],
  },
}, { timestamps: true });

const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

export default User;


