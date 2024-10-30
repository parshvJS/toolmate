import mongoose, { Document, Model, Schema } from "mongoose";


interface IUserMemory extends Document {
    userId: mongoose.Types.ObjectId;
    globalContext_UserState: string[];
    globalContext_UserPreference: string[];
    globalContext_Braingap: string[];
    globalContext_UserChatMemory: string[];
}

// all context is stored in Queue Format 
const UserMemorySchema = new mongoose.Schema<IUserMemory>({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    globalContext_UserState: {
        type: [String],
        default: [],
    },
    globalContext_UserPreference: {
        type: [String],
        default: [""],
    },
    globalContext_Braingap: {
        type: [String],
        default: [""],
    },
    globalContext_UserChatMemory: {
        type: [String],
        default: [""],
    },
},{timestamps:true});

const UserMemory: Model<IUserMemory> = mongoose.model<IUserMemory>('UserMemory', UserMemorySchema);

export default  UserMemory;
