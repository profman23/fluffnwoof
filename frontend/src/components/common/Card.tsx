import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title }) => {
  return (
    <div className={`card ${className}`}>
      {title && <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-gray-800">{title}</h3>}
      {children}
    </div>
  );
};
