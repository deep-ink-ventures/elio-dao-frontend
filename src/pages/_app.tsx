import { isConfigFromService } from '@/config';
import useElioStore from '@/stores/elioStore';
import type { AppProps } from 'next/app';
import { useCallback, useEffect } from 'react';
import StellarSdk from 'stellar-sdk';
import TransactionNotification from '../components/Notification';
import '../styles/global.css';

declare global {
  interface Window {
    StellarSdk: any;
  }
}
if (typeof window !== 'undefined') {
  window.StellarSdk = StellarSdk;
}

const MyApp = ({ Component, pageProps }: AppProps) => {
  const [fetchElioConfig] = useElioStore((s) => [s.fetchElioConfig]);
  const fetchElioConfigCallback = useCallback(() => {
    if (isConfigFromService) {
      fetchElioConfig();
    }
  }, [fetchElioConfig]);

  useEffect(() => {
    // fixme we can also fetch when we build our txn
    fetchElioConfigCallback();
  }, [fetchElioConfigCallback]);
  return (
    <div className='relative overflow-x-hidden'>
      <TransactionNotification />
      <Component {...pageProps} />
    </div>
  );
};

export default MyApp;
