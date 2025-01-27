import React from 'react';
import Link from 'next/link';
import styles from '../css/nav-bar.module.css';

const NavBar: React.FC = () => {
  return (
    <nav className={styles.sideNav}>
      <div className={styles.logoContainer}>
        <img src="/images/placeholder.svg" alt="Logo" className={styles.logo} />
      </div>
      <ul className={styles.navList}>
        <li className={styles.navSearch}>
          <input type="text" placeholder="Search.." />
        </li>
        <li className={styles.navItem}>
          <Link href="/">Home</Link>
        </li>
        <li className={styles.navItem}>
          <Link href="/wallet-search">Wallet Search</Link>
        </li>
        <li className={styles.navItem}>
          <Link href="/wallet-storage">Wallet Storage</Link>
        </li>
        <li className={styles.navItem}>
          <Link href="/">Features</Link>
        </li>
      </ul>
    </nav>
  );
};

export default NavBar;