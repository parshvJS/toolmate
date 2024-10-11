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

  export interface ICommunityForm {
    name: string;
    description: string;
    tags: string;
    profileImage:string;
    bannerImage?:string;
    profileImageParams: string;
    bannerImageParams?: string;
    city?: string;
    country?: string;
    sponsored?: boolean;
  }