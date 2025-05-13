'use client'

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const NavBar = () => {
  const router = useRouter();

  // Handle search input click
  const handleSearchInputClick = () => {
    router.push('/wallet-search');
  };

  return (
    <nav className="h-screen w-64 fixed top-0 left-0 bg-gray-800 text-white">
      <div className="mb-4 p-4">
        <img 
          src="/images/logo-temp.png" 
          alt="Logo" 
          className="w-full h-auto"
        />
      </div>
      <ul className="list-none p-0 m-0">
        <li className="mb-4 px-4">
          <div 
            onClick={handleSearchInputClick}
            className="relative cursor-pointer"
          >
            <div className="flex items-center w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:shadow-gray-500/30">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-gray-500">Search...</span>
            </div>
          </div>
        </li>
        <br></br>
        <li className="mb-2">
          <Link className="block px-4 py-2 hover:bg-gray-700" href="/">
            Home
          </Link>
        </li>
        <li className="mb-2">
          <Link className="block px-4 py-2 hover:bg-gray-700" href="/wallet-storage">
            Wallet Storage
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default NavBar;