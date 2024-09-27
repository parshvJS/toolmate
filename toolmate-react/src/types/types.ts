
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