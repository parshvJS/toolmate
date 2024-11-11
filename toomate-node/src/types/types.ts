export interface iChatname {
    prompt: string,
    sessionId: string
    userId: string
}

export interface INewUserMessage {
    sessionId: string,
    message: string,
    userId:string,
    isBudgetSliderPresent?: boolean,
    budgetSliderValue?: number,
}
export interface ChatSession {
    sessionId: string;
    chatName: string;
    updatedAt: string;
    id: string;
}


export interface ResponseFormat {
    [key: string]: Array<{ sessionId: string; chatName: string }>;
}
export interface IPaymentPlan extends Document {
    essntialPrice: number;
    proPrice: number;
    discountOnSixMonth: number;
    discountOnYearly: number;
}

export interface IBunningsChat {
    categoryName: string,
    products: {
        name: string,
        price: number,
        description: string,
        personalUsage: string,
        rating: string,
        imageUrl: string,
        link: string,
    }[]
}


// Define the structure of a Bunnings product
export interface IBunningsProduct {
    _id: string; // ID of the product
    name: string; // Name of the product
    price: number; // Price of the product
    imageUrl: string; // URL for the product image
    link: string; // URL to view the product
    rating: number; // Average user rating
    personalUsage: string; // Personal usage description
    searchTerm: string; // Category of the product
}

// Define the structure of an additional product
export interface AdditionalProduct {
    _id: string; // ID of the product
    name: string; // Name of the product
    price: number; // Price of the product
    imageUrl: string; // URL for the product image
    link: string; // URL to view the product
    rating: number; // Average user rating
    personalUsage: string; // Personal usage description
}

// Define the structure of a chat entry
export interface ChatEntry {
    bunningsProductList(bunningsProductList: any): unknown;
    sessionId: string; // ID of the chat session
    message: string; // User message
    role: string; // Role of the user (e.g., user, bot)
    isCommunitySuggested: boolean; // Indicates if suggested by community
    communityId: string[]; // IDs of community suggestions
    isProductSuggested: boolean; // Indicates if products were suggested
    productSuggestionList: string[]; // List of product suggestion IDs
    isMateyProduct: boolean; // Indicates if Matey products were suggested
    isBunningsProduct: boolean; // Indicates if Bunnings products were suggested
    productId: string[]; // List of product IDs
    mateyProduct: any[]; // List of Matey products
    createdAt: Date; // Timestamp of the chat entry
    bunningsData?: {
        categoryName: string; // Category of Bunnings products
        products: IBunningsProduct[]; // List of Bunnings products
    }[]; // Optional Bunnings data
    productData?: AdditionalProduct[]; // Optional additional product data
}

// Define the structure of the API response
export interface ApiResponse {
    success: boolean; // Indicates if the request was successful
    data: ChatEntry[]; // Array of chat entries
    pagination: {
        currentPage: number; // Current page number
        totalPages: number; // Total pages available
        totalMessages: number; // Total number of messages
        hasMore: boolean; // Indicates if there are more messages
    }; // Pagination information
}
