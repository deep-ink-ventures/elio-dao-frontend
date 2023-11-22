import Image from 'next/image';
import Link from 'next/link';

import { DaoService } from '@/services/daos';
import { McAccountService } from '@/services/multiCliqueAccount';
import useElioStore from '@/stores/elioStore';
import mountain from '@/svg/mountain.svg';
import placeholderImage from '@/svg/placeholderImage.svg';
import type BigNumber from 'bignumber.js';
import cn from 'classnames';
import { useEffect, useState } from 'react';

interface DaoCardProps {
  daoId: string;
  daoName: string;
  daoOwnerAddress: string;
  daoAssetAddress: string | null;
  imageUrl: string | null;
  setupComplete: boolean;
}

const DaoCard = (props: DaoCardProps) => {
  const { daoName, daoId, daoOwnerAddress, imageUrl } = props;
  const [currentWalletAccount, updateDaoPage] = useElioStore((s) => [
    s.currentWalletAccount,
    s.updateDaoPage,
  ]);
  const [daoBalance, setDaoBalance] = useState<BigNumber>();
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchDaoBalance = async () => {
    if (currentWalletAccount?.publicKey) {
      const balance = await DaoService.getBalance(
        daoId,
        currentWalletAccount.publicKey
      );

      if (balance) {
        setDaoBalance(balance);
      }
    }
  };

  const fetchSignatories = async () => {
    try {
      if (
        daoOwnerAddress &&
        currentWalletAccount?.publicKey !== daoOwnerAddress
      ) {
        const mcAccount = await McAccountService.getMultiCliqueAccount(
          daoOwnerAddress
        );

        if (mcAccount.signatories?.length) {
          setIsAdmin(
            !!(
              currentWalletAccount?.publicKey &&
              mcAccount.signatories
                .map((signatory) => signatory.address.toLowerCase())
                ?.includes(currentWalletAccount.publicKey.toLowerCase())
            )
          );
        }
      } else {
        setIsAdmin(currentWalletAccount?.publicKey === daoOwnerAddress);
      }
    } catch (ex) {
      console.info('Multisig account not found');
    }
  };

  useEffect(() => {
    fetchDaoBalance();
    fetchSignatories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWalletAccount, daoId]);

  const hasOwnedTokens = daoBalance && !daoBalance?.isZero();

  const displayImage = () => {
    if (!imageUrl) {
      return (
        <>
          <Image
            src={placeholderImage}
            alt='placeholder'
            height={60}
            width={60}
          />
          <Image
            className='absolute inset-0 m-auto'
            src={mountain}
            alt='mountain'
            width={30}
            height={17}></Image>
        </>
      );
    }
    return (
      <>
        <img
          src={imageUrl}
          alt={`${daoName} logo image`}
          height={60}
          width={60}
          className='rounded-full'
        />
      </>
    );
  };

  return (
    <div
      className={`card-compact relative z-0 m-1 w-64 py-4  shadow-xl hover:cursor-pointer md:w-56 md:pb-10 md:pt-4`}>
      <Link
        href={`/dao/${encodeURIComponent(daoId)}`}
        onClick={() => {
          updateDaoPage('dashboard');
        }}>
        {isAdmin ? (
          <div className='absolute left-44 top-3 rounded-[15px] bg-primary px-2 py-1 text-xs md:left-40 md:top-3 md:block'>
            admin
          </div>
        ) : null}
        <div className='card-body text-center'>
          <div className='mb-2 flex items-center justify-center'>
            <div
              className={cn('rounded-full p-1', {
                'bg-gradient-to-t from-pink-500 via-red-500 to-yellow-500':
                  hasOwnedTokens,
                'bg-[#403945]': !hasOwnedTokens,
              })}>
              <div className='relative rounded-full bg-[#403945] p-1'>
                {displayImage()}
              </div>
            </div>
          </div>
          <div className='flex flex-col items-center justify-center'>
            <h4
              className={cn(
                `z-10 w-[150px] break-words text-base-content mix-blend-normal md:h-12`,
                {
                  'text-sm': daoName?.length > 26,
                }
              )}>
              {daoName}
            </h4>
          </div>
          <p className='text-sm text-accent'>{`DAO ID: ${daoId}`}</p>
        </div>
      </Link>
      <Link
        href={`/dao/${encodeURIComponent(daoId)}`}
        onClick={() => {
          updateDaoPage('dashboard');
        }}>
        <p className='absolute bottom-[10%] left-[33%] mt-5 hidden text-sm underline underline-offset-2 md:block'>{`See more >`}</p>
      </Link>
    </div>
  );
};

export default DaoCard;
