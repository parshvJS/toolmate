
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

  interface ChatItem{
    sessionId:string;
    chatName:string;
  }
  export interface iChatname {
    dateDiff: string;
    data:ChatItem[]
  }