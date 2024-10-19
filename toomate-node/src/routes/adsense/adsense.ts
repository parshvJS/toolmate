import { createCatagory } from "../../controller/adsense/createcatagory.controller.js";
import { addNewProduct } from "../../controller/adsense/addNewProduct.controller.js";
import { Router } from "express";

const adsense = Router();

adsense.route('/addNewProduct').post(addNewProduct);
adsense.route('/addNewCatagory').post(createCatagory);

export default adsense;