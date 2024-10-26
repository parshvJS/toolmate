import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function getImageUrl(imageParams: string) {
  return `https://toolmate-images-1.s3.ap-southeast-2.amazonaws.com/${imageParams}`;
}