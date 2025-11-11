
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1e2e3e] p-6 rounded-lg shadow-lg w-full max-w-md relative animate-fade-in-up"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <div className="flex justify-between items-center mb-4">
            {title && <h3 className="text-xl font-bold text-white">{title}</h3>}
            <button
                onClick={onClose}
                className="text-gray-400 hover:text-white text-2xl"
            >
                &times;
            </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
