import Image from 'next/image';
import { useRouter } from 'next/router';
import { useState } from 'react';

import CreateProposal from '@/components/CreateProposal';
import ReviewProposal from '@/components/ReviewProposal';
import WalletConnect from '@/components/WalletConnect';
import useElioStore from '@/stores/elioStore';
import arrowLeft from '@/svg/arrowLeft.svg';
import MainLayout from '@/templates/MainLayout';

const CreateProposalPage = () => {
  const [currentWalletAccount, currentDao, updateDaoPage] = useElioStore(
    (s) => [s.currentWalletAccount, s.currentDao, s.updateDaoPage]
  );

  const [page, setPage] = useState('create');
  const router = useRouter();
  const { daoId } = router.query;

  const handleChangePage = (pg: string) => {
    setPage(pg);
  };

  const handleBack = () => {
    updateDaoPage('proposals');
    router.push(`/dao/${encodeURIComponent(daoId as string)}/`);
  };

  const display = () => {
    if (!currentWalletAccount?.publicKey) {
      return (
        <div className='flex flex-col items-center justify-center'>
          <p className='text-center'>
            Please connect wallet to continue creating a new Proposal{' '}
            {currentDao?.daoName}
          </p>
          <WalletConnect text='Connect Wallet To Continue' />
        </div>
      );
    }

    if (page === 'review') {
      return (
        <ReviewProposal
          daoId={daoId as string}
          handleChangePage={handleChangePage}
        />
      );
    }

    return (
      <CreateProposal dao={currentDao} handleChangePage={handleChangePage} />
    );
  };

  return (
    <MainLayout
      title='Create a DAO - ElioDAO'
      description='Create a DAO - ElioDAO'>
      <div
        className='mt-5 flex w-[65px] items-center justify-between hover:cursor-pointer hover:underline'
        onClick={handleBack}>
        <Image src={arrowLeft} width={13} height={7} alt='arrow-left' />
        <div>Back</div>
      </div>
      <div className='container mx-auto mb-16 mt-5 min-h-[600px] max-w-[820px] px-4 py-5 md:min-w-[600px] md:px-12'>
        {display()}
      </div>
    </MainLayout>
  );
};

export default CreateProposalPage;
