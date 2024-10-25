import { loginAdmin } from '../../controller/admin/authAdmin.js';
import { Payment } from '../../controller/payment.controller.js';
import { Router } from 'express'
import { getAllAdmin } from '../../controller/admin/getAllAdmin.js';
import { getAllUsers } from '../../controller/admin/getAllUsers.js';
import { getAllProducts } from '../../controller/admin/getAllProducts.js';

const admin = Router();

admin.route('/payment').post(Payment)
admin.route('/login').post(loginAdmin);
admin.route('/getAllAdmin').post(getAllAdmin);  
admin.route('/getAllUsers').post(getAllUsers); 
admin.route('/getAllProducts').post(getAllProducts)
export { admin }