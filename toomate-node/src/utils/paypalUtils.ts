import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

let ACCESS_TOKEN = '';

export default async function getPaypalAccessToken(reset:boolean = false) {
  if ((!ACCESS_TOKEN || ACCESS_TOKEN === '') || reset) {
    try {
      // Make the POST request to get the access token
      const res = await axios.post(
        `${process.env.PAYPAL_API_BASE_URL}/v1/oauth2/token`, // Replace with your live/production API URL for PayPal
        'grant_type=client_credentials', // Data for the POST request
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded', // Required header
          },
          auth: {
            username: process.env.PAYPAL_CLIENT_ID!, // Your PayPal client ID from environment variables
            password: process.env.PAYPAL_CLIENT_SECRET!, // Your PayPal client secret from environment variables
          },
        }
      );
      
      // Assuming the response contains the access token
      ACCESS_TOKEN = res.data.access_token;
      console.log('Access Token:', ACCESS_TOKEN); // Optional: Log the token
    } catch (error) {
      console.error('Error fetching PayPal access token:', error);
    }
  }
  console.log("returning access token", ACCESS_TOKEN);
  return ACCESS_TOKEN;
}


