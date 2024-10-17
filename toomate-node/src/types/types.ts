export interface iChatname {
    prompt: string,
    sessionId: string
    userId: string
}

export interface INewUserMessage {
    sessionId: string,
    message: string,
    userId:string,
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
