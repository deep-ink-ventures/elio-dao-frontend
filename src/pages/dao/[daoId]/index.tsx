import { BN } from 'bn.js';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import DaoDashboard from '@/components/DaoDashboard';
// import Proposals from '@/components/Proposals';
import Spinner from '@/components/Spinner';
import WalletConnect from '@/components/WalletConnect';
import type { DaoDetail, DaoPage } from '@/stores/elioStore';
import useElioStore from '@/stores/elioStore';
import { daoArray } from '@/stores/fakeData';
import arrowLeft from '@/svg/arrowLeft.svg';
import arrowRight from '@/svg/arrowRight.svg';
import dashboard from '@/svg/dashboard.svg';
import mountain from '@/svg/mountain.svg';
import placeholderImage from '@/svg/placeholderImage.svg';
import proposal from '@/svg/proposal.svg';
import MainLayout from '@/templates/MainLayout';
import { uiTokens } from '@/utils';

const MainDaoPage = () => {
  const router = useRouter();
  const { daoId } = router.query;

  const [
    currentWalletAccount,
    currentDao,
    updateDaoPage,
    daoPage,
    updateCurrentDao,
  ] = useElioStore((s) => [
    s.currentWalletAccount,
    s.currentDao,
    s.updateDaoPage,
    s.daoPage,
    s.updateCurrentDao,
  ]);

  const daoTokenBalance = new BN(250000000000000);

  const handleChangePage = (pageParam: DaoPage) => {
    updateDaoPage(pageParam);
  };

  // useEffect(() => {
  //   if (!daoId) {
  //     return;
  //   }
  //   fetchDaoFromDB(daoId as string);
  //   fetchDao(daoId as string);
  // }, [daoId, fetchDaoFromDB, fetchDao]);

  // useEffect(() => {
  //   if (currentDao?.daoAssetId && currentWalletAccount) {
  //     fetchDaoTokenBalanceFromDB(
  //       currentDao?.daoAssetId,
  //       currentWalletAccount.address
  //     );
  //   } else {
  //     updateDaoTokenBalance(new BN(0));
  //   }
  // }, [
  //   currentDao,
  //   currentWalletAccount,
  //   fetchDaoTokenBalanceFromDB,
  //   updateDaoTokenBalance,
  // ]);

  useEffect(() => {
    if (!daoId) {
      return;
    }
    const index = Number(daoId) - 1;
    updateCurrentDao(daoArray[index] as DaoDetail);
  }, [daoId]);

  const displayImage = () => {
    if (!currentDao || !currentDao.images.medium) {
      return (
        <div className='relative flex items-center justify-center'>
          <Image
            src={placeholderImage}
            alt='placeholder'
            height={120}
            width={120}
          />
          <div className='absolute'>
            <Image src={mountain} alt='mountain' width={30} height={17}></Image>
          </div>
        </div>
      );
    }
    return (
      <div className='relative flex items-center justify-center'>
        {/* fixme for Next Image */}
        <img
          src={currentDao.images.medium}
          alt={`${currentDao.daoName} logo image`}
          height={120}
          width={120}
          className='rounded-full'
        />
      </div>
    );
  };

  const displayPage = () => {
    // if (daoPage === 'proposals') {
    //   return <Proposals daoId={daoId as string} />;
    // }
    return <DaoDashboard />;
  };

  const handleBack = () => {
    router.push(`/#explorer`);
  };

  return (
    <MainLayout
      title={`${currentDao?.daoName} - Elio DAO - DAO Platform On Stellar'`}
      description={`${currentDao?.daoName} - Create a DAO`}>
      <div
        className='mt-5 flex w-[65px] items-center justify-between hover:cursor-pointer hover:underline'
        onClick={handleBack}>
        <Image src={arrowLeft} width={13} height={7} alt='arrow-left' />
        <div>Back</div>
      </div>

      {!currentDao || currentDao.daoId !== daoId ? (
        <Spinner />
      ) : (
        <div className='mt-5 flex min-h-[500px] justify-between gap-x-4'>
          <div className='container flex h-[640px] basis-1/4 flex-col items-center justify-evenly gap-y-4 py-4'>
            <div className='flex flex-col items-center justify-center'>
              <div>{displayImage()}</div>
              <div className='mt-3 flex flex-col items-center md:overflow-visible'>
                <h4
                  className={`z-10 inline-block w-[150px] truncate text-center text-lg text-base-content mix-blend-normal ${
                    currentDao && currentDao?.daoName?.length > 20
                      ? 'text-base'
                      : ''
                  }`}>
                  {currentDao?.daoName}
                </h4>
                <p className='text-center text-accent'>{`DAO ID: ${currentDao?.daoId}`}</p>
              </div>
            </div>
            <div className='flex justify-center py-3 '>
              {!currentWalletAccount?.publicKey ? (
                <WalletConnect text='Connect To View Tokens' />
              ) : (
                <div className='flex h-[80px] w-[240px] items-center justify-between rounded-xl bg-base-50 px-4'>
                  <div className='px-5 text-center text-sm'>
                    {!currentWalletAccount?.publicKey ? (
                      <p className=''>Connect Wallet To View Tokens</p>
                    ) : (
                      <div className='flex flex-col'>
                        <p>You have</p>
                        <p>
                          {' '}
                          {uiTokens(
                            daoTokenBalance,
                            'dao',
                            currentDao?.daoId
                          )}{' '}
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <Image
                      src={arrowRight}
                      width={12}
                      height={6}
                      alt='arrow-right'
                    />
                  </div>
                </div>
              )}
            </div>
            <div className='w-full'>
              <div
                className={`${
                  daoPage === 'dashboard' ? 'selected-tab' : 'brightness-75'
                } flex h-[55px] px-7 py-4 hover:cursor-pointer`}
                onClick={() => handleChangePage('dashboard')}>
                <Image
                  src={dashboard}
                  height={15}
                  width={15}
                  alt='dashboard'
                  className='mr-4'
                />
                <p>Dashboard</p>
              </div>
              <div
                className={`${
                  daoPage === 'proposals' ? 'selected-tab' : 'brightness-75'
                } flex h-[55px] px-7 py-4 hover:cursor-pointer`}
                onClick={() => handleChangePage('proposals')}>
                <Image
                  src={proposal}
                  height={15}
                  width={15}
                  alt='dashboard'
                  className='mr-4'
                />
                <p>Proposals</p>
              </div>
              {/* <div className={`flex h-[55px] py-4 px-7 brightness-75`}>
                <Image
                  src={about}
                  height={15}
                  width={15}
                  alt='dashboard'
                  className='mr-4'
                />
                <p>About</p>
              </div>
              <div className='flex h-[55px] py-4 px-7 brightness-75'>
                <Image
                  src={settings}
                  height={15}
                  width={15}
                  alt='dashboard'
                  className='mr-4'
                />
                <p>Settings</p>
              </div> */}
            </div>
          </div>
          <div className='container basis-3/4 p-5'>
            {!currentDao || currentDao.daoId !== daoId ? (
              <Spinner />
            ) : (
              displayPage()
            )}
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default MainDaoPage;
