import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string; // Make label optional
  id: string;
  children: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({ label, id, children, ...props }) => {
  const { className, ...rest } = props;

  const selectElement = (
    <select
      id={id}
      className={`w-full px-4 py-2 bg-[#324a5f] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#00d4ff] focus:border-transparent ${className || ''}`}
      {...rest}
    >
      {children}
    </select>
  );

  if (!label) {
    return selectElement;
  }

  return (
    <div className="mb-4">
      <label htmlFor={id} className="block mb-2 text-sm font-medium text-gray-300">
        {label}
      </label>
      {selectElement}
    </div>
  );
};

export default Select;
