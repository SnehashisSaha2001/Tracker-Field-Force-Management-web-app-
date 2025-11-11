
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', title }) => {
  return (
    <div className={`bg-[#1e2e3e] border border-gray-700/50 rounded-2xl p-4 sm:p-6 shadow-2xl shadow-black/20 ${className}`}>
      {title && <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>}
      {children}
    </div>
  );
};

export default Card;
