'use client'

import React, { useState, useEffect } from 'react';
import { WalletFormData } from '../types/types';

// Props interface defines what this component expects from parent
interface AddWalletFormProps {
  onSubmit: (data: WalletFormData) => Promise<void>; // Function to call when form is submitted
  onCancel: () => void; // Function to call when form is cancelled
  initialData?: WalletFormData; // Optional pre-filled data for editing mode
}


const AddWalletForm: React.FC<AddWalletFormProps> = ({ onSubmit, onCancel, initialData }) => {
  // Initialize form state with empty values
  const [formData, setFormData] = useState<WalletFormData>({ // useState hook maintains and updates internal state of the form data
    wallet: '',
    name: '',
    tags: ''
  }); // Default values are shown on the form fields

  // useEffect used to populates form with provided data when in edit mode
  useEffect(() => {
    if (initialData) {
      setFormData(initialData); // Fills form fields with existing wallet data (edit mode)
    }
  }, [initialData]);

  // Handles changes to form fields before submission
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;  // Extract field name and new value
    setFormData(prev => ({
      ...prev, // Holds previous fields form data
      [name]: value 
    }));
  };

  // Handles form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default browser form submission
    await onSubmit(formData); // Call parent submit handler with form data
    setFormData({ wallet: '', name: '', tags: '' }); // Reset fields
  };

  return (
    // Main form container
    <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg mb-6">
      <div className="space-y-4">
        {/* FORM - Wallet Address Field */}
        <div>
          <label className="block text-white mb-2">Wallet Address</label>
          <input
            type="text"
            name="wallet"
            value={formData.wallet}
            onChange={handleInputChange}
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            required/>
        </div>

        {/* FORM - Wallet Name Field */}
        <div>
          <label className="block text-white mb-2">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            required/>
        </div>

        {/* FORM - Tags Field - Optional comma-separated list */}
        <div>
          <label className="block text-white mb-2">Tags</label>
          <input
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleInputChange}
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            // Non required field - tags are optional
            placeholder="Separate tags with commas"/>

        </div>

        {/* Action Buttons Container */}
        <div className="flex space-x-4">
          <button
            type="submit"
            className="flex-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Save Wallet
          </button>
          
          {/* Cancel Button - Uses type="button" to avoid form submission */}
          <button
            type="button"
            onClick={onCancel}  // Calls the onCancel prop function from parent
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
};

export default AddWalletForm;