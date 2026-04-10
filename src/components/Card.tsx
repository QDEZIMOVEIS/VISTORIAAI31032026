import React from 'react';

const Card = ({ children, className = '' }: any) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>
    {children}
  </div>
);

export default Card;
