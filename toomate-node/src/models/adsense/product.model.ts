import mongoose from "mongoose";

const productSchema = new mongoose.Schema({

    name: String,
    image: [String],
    url: String,
    description: String,
    offerDescription: String // like 70% off or 15% cashback etc

})

const Product = mongoose.model('Product', productSchema);
export default Product;