import { Schema, model, Types } from 'mongoose';


// Create the Mongoose schema for the user payment info
const UserPaymentSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // store paypal subscriptionId
  activePlan:{
    type: String,
    default:''
  },
  planAccess: {
    type: [Boolean],
    default: [true, false, false]  // By default, the user has the basic plan
  },
}, {
  timestamps: true // Automatically adds createdAt and updatedAt timestamps
});

// Create and export the model
export const UserPayment = model('UserPayment', UserPaymentSchema);
