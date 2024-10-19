import mongoose from "mongoose";

const productSchema = new mongoose.Schema({

    name: String,
    imageParams: [String],
    url: String,
    description: String,
    offerDescription: String, // like 70% off or 15% cashback etc
    catagory:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductCatagory'
    }
})

const Product = mongoose.model('Product', productSchema);
export default Product;