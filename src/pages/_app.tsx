import useElioStore from '@/stores/elioStore';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import TransactionNotification from '../components/Notification';
import '../styles/global.css';

const MyApp = ({ Component, pageProps }: AppProps) => {
  const fetchElioConfig = useElioStore((s) => s.fetchElioConfig);
  useEffect(() => {
    // fixme we can also fetch when we build our txn
    fetchElioConfig();
  });
  return (
    <div>
      <TransactionNotification />
      <Component {...pageProps} />
    </div>
  );
};

export default MyApp;
