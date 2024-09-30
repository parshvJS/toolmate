import { Schema, model, Types } from 'mongoose';

// Define the user schema
interface IUserPayment {
  userId: Types.ObjectId;            // Reference to the user
  stripeCustomerId: string;          // Stripe customer ID
  stripeSubscriptionId: string;      // Stripe subscription ID
  stripePaymentIntentId: string;     // Stripe payment intent ID
  productPriceId: string;            // Stripe product price ID
  amountPaid: number;                // Total amount paid in smallest currency unit (e.g., cents)
  currency: string;                  // Currency in which payment was made (e.g., 'usd')
  planAccess: [boolean, boolean, boolean];  // Plan access flags, default [true, false, false]
}

// Create the Mongoose schema for the user payment info
const UserPaymentSchema = new Schema<IUserPayment>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stripeCustomerId: {
    type: String,
    default: ""
  },
  stripeSubscriptionId: {
    type: String,
    default:""
  },
  stripePaymentIntentId: {
    type: String,
    default:""
  },
  productPriceId: {
    type: String,
    default:""
  },
  amountPaid: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'usd'  // Default currency is USD
  },
  planAccess: {
    type: [Boolean],
    default: [true, false, false]  // By default, the user has the basic plan
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt timestamps
});

// Create and export the model
export const UserPayment = model<IUserPayment>('UserPayment', UserPaymentSchema);
