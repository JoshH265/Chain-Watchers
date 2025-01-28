'use client'

import React from 'react';
import Link from 'next/link';

const NavBar = () => {
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
          <input 
            type="text" 
            placeholder="Search.." 
            className="w-full p-2 rounded border border-gray-300"
          />
        </li>
        <li className="mb-2">
          <Link className="block px-4 py-2 hover:bg-gray-700" href="/">
            Home
          </Link>
        </li>
        <li className="mb-2">
          <Link className="block px-4 py-2 hover:bg-gray-700" href="/wallet-search">
            Wallet Search
          </Link>
        </li>
        <li className="mb-2">
          <Link className="block px-4 py-2 hover:bg-gray-700" href="/wallet-storage">
            Wallet Storage
          </Link>
        </li>
        <li className="mb-2">
          <Link className="block px-4 py-2 hover:bg-gray-700" href="/">
            Features
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default NavBar;