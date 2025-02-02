'use client'

import React, { useState, useEffect } from 'react';

interface WalletFormData {
  wallet: string;
  name: string;
  tags: string;
}

interface AddWalletFormProps {
  onSubmit: (data: WalletFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: WalletFormData; // Add initialData prop
}

const AddWalletForm: React.FC<AddWalletFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [formData, setFormData] = useState<WalletFormData>({
    wallet: '',
    name: '',
    tags: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    setFormData({ wallet: '', name: '', tags: '' });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg mb-6">
      <div className="space-y-4">
        <div>
          <label className="block text-white mb-2">Wallet Address</label>
          <input
            type="text"
            name="wallet"
            value={formData.wallet}
            onChange={handleInputChange}
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            required
          />
        </div>
        <div>
          <label className="block text-white mb-2">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            required
          />
        </div>
        <div>
          <label className="block text-white mb-2">Tags</label>
          <input
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleInputChange}
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            placeholder="Separate tags with commas"
          />
        </div>
        <div className="flex space-x-4">
          <button
            type="submit"
            className="flex-1 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Save Wallet
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
};

export default AddWalletForm;