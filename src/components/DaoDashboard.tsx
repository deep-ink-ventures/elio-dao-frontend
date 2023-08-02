import useElioDao from '@/hooks/useElioDao';
import Link from 'next/link';

// import DestroyDao from '@/components/DestroyDao';
import { DAO_UNITS } from '@/config';
import useElioStore from '@/stores/elioStore';
import BigNumber from 'bignumber.js';

const DaoDashboard = (props: { daoId: string }) => {
  const [currentWalletAccount, currentDao, isTxnProcessing, handleErrors] =
    useElioStore((s) => [
      s.currentWalletAccount,
      s.currentDao,
      s.isTxnProcessing,
      s.handleErrors,
    ]);
  const { destroyDao } = useElioDao();
  const daoTokenBalance = BigNumber(25000).multipliedBy(DAO_UNITS);

  const handleDestroyDao = async () => {
    try {
      await destroyDao(props.daoId);
    } catch (err) {
      handleErrors(err);
    }
  };

  return (
    <div className='flex flex-col gap-y-4'>
      <div>
        <h1>{currentDao?.daoName}</h1>
      </div>
      <div>
        <p>{currentDao?.descriptionShort}</p>
      </div>
      <div>
        <div className='flex flex-wrap gap-x-4'>
          {currentDao?.setupComplete ||
          currentWalletAccount?.publicKey !==
            currentDao?.daoOwnerAddress ? null : (
            <Link
              href={`/dao/${encodeURIComponent(
                currentDao?.daoId as string
              )}/customize`}
              className={`${!currentWalletAccount ? 'disable-link' : ''}`}>
              <button
                className={`btn-primary btn w-[180px]`}
                disabled={!currentWalletAccount}>
                Customize DAO
              </button>
            </Link>
          )}
          {/* <Link
            href={`/dao/${encodeURIComponent(
              currentDao?.daoId as string
            )}/create-proposal`}
            className={`${
              !currentWalletAccount ||
              daoTokenBalance?.isZero() ||
              !currentDao?.setupComplete
                ? 'disable-link'
                : ''
            }`}> */}
          <button
            className={`btn-primary btn w-[180px]`}
            disabled={
              !currentWalletAccount ||
              daoTokenBalance?.isZero() ||
              !currentDao?.setupComplete
            }>
            Create Proposal
          </button>
          {/* </Link> */}
          {/* <Link
            href={`/dao/${encodeURIComponent(
              currentDao?.daoId as string
            )}/tokens`}
            className={`${
              !currentWalletAccount ||
              daoTokenBalance?.isZero() ||
              !daoTokenBalance?.gt(new BN(0))
                ? 'disable-link'
                : ''
            }`} > */}
          <button
            className={`btn-primary btn w-[180px]`}
            disabled={
              !currentWalletAccount ||
              daoTokenBalance?.isZero() ||
              !daoTokenBalance?.gt(BigNumber(0))
            }>
            Send Tokens
          </button>
          {/* </Link> */}

          <button
            className={`btn-primary btn w-[180px] ${
              isTxnProcessing ? 'loading' : ''
            }`}
            disabled={
              !currentWalletAccount ||
              currentWalletAccount.publicKey !== currentDao?.daoOwnerAddress
            }
            onClick={handleDestroyDao}>
            Destroy DAO
          </button>
        </div>
      </div>
      <div className='flex flex-col justify-end border-t-2 border-dashed'>
        <div className='mt-3 flex flex-col '>
          <p className='text-neutral-focus'>{`Council's multisignature address:`}</p>
          <p className='w-fit bg-[#403945]'>{currentDao?.daoOwnerAddress}</p>
        </div>
      </div>
    </div>
  );
};

export default DaoDashboard;
