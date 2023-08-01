import useElioDao from '@/hooks/useElioDao';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import Congratulations from '@/components/Congratulations';
import CouncilTokens from '@/components/CouncilTokens';
import GovernanceForm from '@/components/GovernanceForm';
import Loading from '@/components/Loading';
import MetadataForm from '@/components/MetadataForm';
import WalletConnect from '@/components/WalletConnect';
import useElioStore from '@/stores/elioStore';
import MainLayout from '@/templates/MainLayout';

const Customize = () => {
  const [
    currentWalletAccount,
    currentDao,
    fetchDaoDB,
    showCongrats,
    isTxnProcessing,
  ] = useElioStore((s) => [
    s.currentWalletAccount,
    s.currentDao,
    s.fetchDaoDB,
    s.showCongrats,
    s.isTxnProcessing,
  ]);

  const router = useRouter();
  const { daoId } = router.query;
  const [showPage, setShowPage] = useState(false);
  const [hasMetadata, setHasMetadata] = useState(false);
  const { getDaoMetadata } = useElioDao();
  const handleReturnToDashboard = () => {
    router.push(`/dao/${encodeURIComponent(daoId as string)}`);
  };

  useEffect(() => {
    if (!daoId) {
      return;
    }
    const TO = setTimeout(async () => {
      fetchDaoDB(daoId as string);
      getDaoMetadata(daoId as string).then((data) => {
        if (Array.isArray(data) && typeof data[0] === 'string') {
          setHasMetadata(true);
        }
      });
    }, 700);
    // eslint-disable-next-line
    return () => clearTimeout(TO);
  }, [daoId, isTxnProcessing]);

  useEffect(() => {
    setTimeout(() => {
      return setShowPage(true);
    }, 1000);
  }, []);

  const display = () => {
    if (!currentWalletAccount?.publicKey) {
      return (
        <div className='flex flex-col items-center'>
          <p>
            Please connect wallet to continue customizing {currentDao?.daoName}
          </p>
          <WalletConnect text='Connect Wallet To Continue' />
        </div>
      );
    }
    if (
      currentWalletAccount.publicKey !== currentDao?.daoOwnerAddress &&
      !showCongrats
    ) {
      return (
        <div className='flex justify-center'>
          <div className='flex flex-col items-center'>
            <p className='my-2'>
              Sorry, you are not the admin of {currentDao?.daoName}
            </p>
            <button
              className='btn-primary btn'
              onClick={handleReturnToDashboard}>
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }

    if (!currentDao?.metadataHash || !hasMetadata) {
      return <MetadataForm daoId={daoId as string} />;
    }

    if (
      currentDao &&
      currentDao.metadataHash &&
      hasMetadata &&
      !currentDao.proposalDuration
    ) {
      return <GovernanceForm daoId={daoId as string} />;
    }

    if (
      currentDao &&
      currentDao.metadataHash &&
      currentDao.proposalDuration &&
      !currentDao.setupComplete &&
      !showCongrats
    ) {
      return <CouncilTokens daoId={daoId as string} />;
    }

    if ((currentDao && currentDao.setupComplete) || showCongrats) {
      return <Congratulations daoId={daoId as string} />;
    }
    return null;
  };

  return (
    <MainLayout
      title='Create a DAO - ElioDAO'
      description='Create a DAO - ElioDAO'>
      <div className='container mx-auto mt-5 min-w-[600px] max-w-[820px] px-12 py-5'>
        {showPage && display()}
        {!showPage && <Loading />}
      </div>
    </MainLayout>
  );
};

export default Customize;
