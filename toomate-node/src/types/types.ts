export interface iChatname {
    prompt: string,
    sessionId: string
    userId: string
}

export interface INewUserMessage {
    sessionId: string,
    message: string
}
export interface ChatSession {
    sessionId: string;
    chatName: string;
    updatedAt: string;
}


export interface ResponseFormat {
    [key: string]: Array<{ sessionId: string; chatName: string }>;
}
