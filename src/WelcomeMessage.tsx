import React from "react";

interface WelcomeMessageProps {
  name: string;
  uncompletedCount: number;
  className?: string; // クラスを受け取るためのオプションのプロパティ
}

const WelcomeMessage: React.FC<WelcomeMessageProps> = ({
  name,
  uncompletedCount,
  className = "", // デフォルト値として空文字を設定
}) => {
  return (
    <div className={`text-lg font-semibold ${className}`}>
      {name}さん、残りタスクは {uncompletedCount} 件です
    </div>
  );
};

export default WelcomeMessage;
