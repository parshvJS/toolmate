import mongoose from "mongoose";

const userChatSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    sessionId:{
        type: String,
        required: true,
    },
    chatName:{
        type: String,
        default:""
    }
},{timestamps:true});

const UserChat = mongoose.model('UserChat', userChatSchema);
export default UserChat;