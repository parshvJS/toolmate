
export interface IChat {
    role: string;
    message: string;
  expression?: string;
  }
  
export interface ExpressionData {
    kwargs: {
    content: string;
    };
  }

 export  interface ChatItem{
    sessionId:string;
    chatName:string;
    id:string;
  }
  export interface iChatname {
    dateDiff: string;
    data:ChatItem[]
  }