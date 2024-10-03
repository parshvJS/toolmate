import {Router} from 'express'
import {handleUserPaidAndPersonalInfo} from '../../controller/_private/handleUserPaidAndPersonalInfo.controller.js'
import { getChatHistory } from '../../controller/_private/getChatHistory.controller.js';
import { updateChatHistory } from '../../controller/_private/updateChatHistory.controller.js';
const paidDashbaord = Router();

paidDashbaord.route("/getUserPaidAndPersonalInfo").post(handleUserPaidAndPersonalInfo);
paidDashbaord.route("/getChatHistory").post(getChatHistory);
paidDashbaord.route("/updateChatHistory").post(updateChatHistory);

export {paidDashbaord}