'use client'

import CryptoPrices from './crypto-prices';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-4 fixed bottom-0 w-full z-50">
      <div className="px-4">
        <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
            <p className="border-r pr-3 mr-5">Chain Watchers </p>
            <CryptoPrices />
            </div>
          <div className="flex gap-4 justify-content align-items">
            <a href="#" className="hover:text-gray-300">Footnote</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;