import React from "react";

type ExpressionType = 
  | "laugh"
  | "hello"
  | "smile"
  | "offer"
  | "1thumb"
  | "2thumb"
  | "tool"
  | "thinking";

export default function MateyExpression({
  expression,
}: {
  expression: ExpressionType;
}) {
  const imagePath = `/assets/matey/`;

  const expressionMap: { [key in ExpressionType]: string } = {
    laugh: "exited.svg",
    hello: "helloing.svg",
    smile: "confident.svg",
    offer: "presenting.svg",
    "1thumb": "thumbsUp.svg",
    "2thumb": "bothThumbsUp.svg",
    tool: "tools.svg",
    thinking: "thinking.svg",
  };

  return (
    <img
      src={`${imagePath}${expressionMap[expression]}`}
      alt={expression}
      className="w-[400px] h-[100px]"
    />
  );
}
