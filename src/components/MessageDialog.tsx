
import React from 'react';

interface MessageDialogProps {
  title: string;
  message: string;
  onClose: () => void;
}

const MessageDialog: React.FC<MessageDialogProps> = ({ title, message, onClose }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg w-2/3 text-gray-800 my-4">
      <h2 className="text-xl font-bold mb-4 text-gray-900">{title}</h2>
      <div className="max-h-64 overflow-y-auto mb-4">
        <p className="whitespace-pre-wrap">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Close
      </button>
    </div>
  );
};

export default MessageDialog;
