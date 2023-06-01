import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import Congratulations from '@/components/Congratulations';
import CouncilTokens from '@/components/CouncilTokens';
import GovernanceForm from '@/components/GovernanceForm';
import Loading from '@/components/Loading';
import LogoForm from '@/components/LogoForm';
import WalletConnect from '@/components/WalletConnect';
import useElioStore from '@/stores/elioStore';
import MainLayout from '@/templates/MainLayout';

const Customize = () => {
  const [currentWalletAccount, currentDao, createDaoSteps] = useElioStore(
    (s) => [s.currentWalletAccount, s.currentDao, s.createDaoSteps]
  );

  const router = useRouter();
  const { daoId } = router.query;
  const [showPage, setShowPage] = useState(false);

  // const handleReturnToDashboard = () => {
  //   router.push(`/dao/${encodeURIComponent(daoId as string)}`);
  // };

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
    // if (
    //   currentWalletAccount.publicKey !== currentDaoFromChain?.daoOwnerAddress &&
    //   !showCongrats
    // ) {
    //   return (
    //     <div className='flex justify-center'>
    //       <div className='flex flex-col items-center'>
    //         <p className='my-2'>
    //           Sorry, you are not the admin of {currentDao?.daoName}
    //         </p>
    //         <button
    //           className='btn-primary btn'
    //           onClick={handleReturnToDashboard}>
    //           Return to Dashboard
    //         </button>
    //       </div>
    //     </div>
    //   );
    // }

    if (createDaoSteps === 2) {
      return <LogoForm daoId={daoId as string} />;
    }

    if (createDaoSteps === 3) {
      return <GovernanceForm daoId={daoId as string} />;
    }

    if (createDaoSteps === 4) {
      return <CouncilTokens daoId={daoId as string} />;
    }

    if (createDaoSteps === 5) {
      return <Congratulations daoId={daoId as string} />;
    }
    return null;
  };

  return (
    <MainLayout
      title='Create a DAO - GenesisDAO'
      description='Create a DAO - GenesisDAO'>
      <div className='container mx-auto mt-5 min-w-[600px] max-w-[820px] px-12 py-5'>
        {showPage && display()}
        {!showPage && <Loading />}
      </div>
    </MainLayout>
  );
};

export default Customize;
