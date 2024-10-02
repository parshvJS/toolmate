import {Router} from 'express'
import {handleUserPaidAndPersonalInfo} from '../../controller/_private/handleUserPaidAndPersonalInfo.controller.js'
import { getChatHistory } from '../../controller/_private/getChatHistory.controller.js';
const paidDashbaord = Router();

paidDashbaord.route("/getUserPaidAndPersonalInfo").post(handleUserPaidAndPersonalInfo);
paidDashbaord.route("/getChatHistory").post(getChatHistory);

export {paidDashbaord}