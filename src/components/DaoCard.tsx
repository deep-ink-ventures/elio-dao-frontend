import Image from 'next/image';
import Link from 'next/link';

import useElioStore from '@/stores/elioStore';
import mountain from '@/svg/mountain.svg';
import placeholderImage from '@/svg/placeholderImage.svg';
import cn from 'classnames';

interface DaoCardProps {
  daoId: string;
  daoName: string;
  daoOwnerAddress: string;
  daoAssetId: number | null;
  imageUrl: string | null;
  setupComplete: boolean;
}

const DaoCard = (props: DaoCardProps) => {
  const [currentWalletAccount] = useElioStore((s) => [s.currentWalletAccount]);
  const displayImage = () => {
    if (!props.imageUrl) {
      return (
        <>
          <Image
            src={placeholderImage}
            alt='placeholder'
            height={60}
            width={60}
          />
          <div className='absolute'>
            <Image src={mountain} alt='mountain' width={30} height={17}></Image>
          </div>
        </>
      );
    }
    return (
      <>
        <img
          src={props.imageUrl}
          alt={`${props.daoName} logo image`}
          height={60}
          width={60}
          className='rounded-full'
        />
      </>
    );
  };

  return (
    <div
      className={`card-compact relative z-0 m-1 w-64 py-4 text-center shadow-xl hover:cursor-pointer md:w-56 md:pb-10 md:pt-4`}>
      <Link href={`/dao/${encodeURIComponent(props.daoId)}`}>
        {currentWalletAccount?.publicKey === props.daoOwnerAddress ? (
          <div className='absolute left-40 top-3 hidden rounded-[15px] bg-primary px-2 py-1 text-xs md:block'>
            admin
          </div>
        ) : null}
        <div className='card-body'>
          <div className='mb-2 flex items-center justify-center'>
            {displayImage()}
          </div>
          <div className='flex flex-col items-center justify-center'>
            <h4
              className={cn(
                `z-10 w-[150px] break-words text-base-content mix-blend-normal md:h-12`,
                {
                  'text-sm': props.daoName?.length > 26,
                }
              )}>
              {props.daoName}
            </h4>
          </div>
          <p className='text-sm text-accent'>{`DAO ID: ${props.daoId}`}</p>
        </div>
      </Link>
      <Link href={`/dao/${encodeURIComponent(props.daoId)}`}>
        <p className='absolute bottom-[10%] left-[33%] mt-5 hidden text-sm underline underline-offset-2 md:block'>{`See more >`}</p>
      </Link>
    </div>
  );
};

export default DaoCard;
