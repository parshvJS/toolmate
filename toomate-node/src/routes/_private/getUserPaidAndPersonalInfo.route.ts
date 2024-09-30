import {Router} from 'express'
import {handleUserPaidAndPersonalInfo} from '../../controller/_private/handleUserPaidAndPersonalInfo.controller.js'
const getUserPaidAndPersonalInfo = Router();

getUserPaidAndPersonalInfo.route("/getUserPaidAndPersonalInfo").post(handleUserPaidAndPersonalInfo);


export {getUserPaidAndPersonalInfo}