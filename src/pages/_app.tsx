import '../app/globals.css';
import { AppProps } from 'next/app';
import NavBar from '../components/nav-bar';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <NavBar />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;