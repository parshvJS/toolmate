import { Payment } from '../../controller/payment.controller.js';
import {Router} from 'express'

const admin = Router();

admin.route('/payment').post(Payment)

export {admin}