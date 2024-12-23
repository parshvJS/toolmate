import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function getImageUrl(imageParams: string) {
  return `https://toolmate-images-1.s3.ap-southeast-2.amazonaws.com/${imageParams}`;
}

// calulate discounted price
export function calculateDiscountedPrice(price: number, discount: number) {
  return (price - price * discount / 100).toFixed(2);
}

// calculate price user saved
export function calculateImpact(price: number, discountPercent: number) {
  const discountedPrice = parseFloat(calculateDiscountedPrice(price, discountPercent));
  return (price - discountedPrice).toFixed(2);
}

export function extractBAToken(url:string) {
  try {
      // Parse the URL using the URL constructor
      const parsedUrl = new URL(url);

      // Get the value of the 'ba_token' parameter
      const baToken = parsedUrl.searchParams.get('ba_token');

      // Return the BA token or null if not present
      return baToken || null;
  } catch (error:any) {
      console.error('Invalid URL:', error.message);
      return null;
  }
}

