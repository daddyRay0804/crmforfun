import type { AppProps } from 'next/app';
import { ToastHost } from '../components/Toast';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <ToastHost />
      <Component {...pageProps} />
    </>
  );
}
