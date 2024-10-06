import {Router} from 'express'
import {handleUserPaidAndPersonalInfo} from '../../controller/_private/handleUserPaidAndPersonalInfo.controller.js'
import { getChatHistory } from '../../controller/_private/getChatHistory.controller.js';
import { updateChatHistory } from '../../controller/_private/updateChatHistory.controller.js';
import { getChatConversationHistory } from '../../controller/_private/getChatConversationHistory.controller.js';
import { changeChatName } from '../../controller/_private/changeChatName.controller.js';
import { deleteChat } from '../../controller/_private/deleteChat.controller.js';
import { bookmarkChat } from '../../controller/_private/bookmarkChat.controller.js';
const paidDashbaord = Router();

paidDashbaord.route("/getUserPaidAndPersonalInfo").post(handleUserPaidAndPersonalInfo);
paidDashbaord.route("/getChatHistory").post(getChatHistory);
paidDashbaord.route("/updateChatHistory").post(updateChatHistory);
paidDashbaord.route("/getChatConversationHistory").post(getChatConversationHistory);
paidDashbaord.route("/changeChatName").post(changeChatName);
paidDashbaord.route("/deleteChat").post(deleteChat);
paidDashbaord.route("/bookmarkChat").post(bookmarkChat);
export {paidDashbaord}