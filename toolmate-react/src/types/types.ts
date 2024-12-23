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
    profileImage:string;
    bannerImage?:string;
    profileImageParams: string;
    bannerImageParams?: string;
  }

  export interface ProductItem{
    catagoryName:string;
    products:any[]
  }

  export interface RefundLog {
    id: string
    status: string
    amount: string
    createdAt: string
    seller_payable_breakdown: {
      gross_amount: {
        currency_code: string
        value: string
      }
      paypal_fee: {
        currency_code: string
        value: string
      }
      net_amount: {
        currency_code: string
        value: string
      }
      total_refunded_amount: {
        currency_code: string
        value: string
      }
    }
  }
  
  