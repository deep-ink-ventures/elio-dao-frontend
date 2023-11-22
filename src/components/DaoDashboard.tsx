import useElioDao from '@/hooks/useElioDao';
import Link from 'next/link';

// import DestroyDao from '@/components/DestroyDao';
import useElioStore from '@/stores/elioStore';

const DaoDashboard = (props: { daoId: string }) => {
  const [
    currentWalletAccount,
    currentDao,
    isTxnProcessing,
    handleErrors,
    daoTokenBalance,
  ] = useElioStore((s) => [
    s.currentWalletAccount,
    s.currentDao,
    s.isTxnProcessing,
    s.handleErrors,
    s.daoTokenBalance,
  ]);
  const { destroyDao } = useElioDao();

  const isSetupComplete = currentDao?.setupComplete;

  const allowCreateProposal =
    currentWalletAccount?.publicKey &&
    isSetupComplete &&
    !daoTokenBalance?.isZero();

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
        <div className='flex flex-wrap gap-4'>
          {/* fixme should go back to use currentDao.setupComplete once we can transfer tokens */}
          {isSetupComplete ||
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
          <Link
            href={`/dao/${encodeURIComponent(
              currentDao?.daoId as string
            )}/create-proposal`}
            className={`${!allowCreateProposal ? 'disable-link' : ''}`}>
            <button
              className={`btn-primary btn w-[180px]`}
              disabled={!allowCreateProposal}>
              Create Proposal
            </button>
          </Link>
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
          {/* <button className={`btn-primary btn w-[180px]`} disabled>
            Send Tokens
          </button> */}
          {/* </Link> */}

          <button
            className={`btn-primary btn w-[180px] ${
              isTxnProcessing ? 'loading' : ''
            }`}
            disabled={
              !currentWalletAccount ||
              (currentWalletAccount.publicKey !== currentDao?.daoOwnerAddress &&
                !currentDao?.signatories?.some(
                  (signatory) =>
                    signatory.address.toLowerCase() ===
                    currentWalletAccount?.publicKey?.toLowerCase()
                ))
            }
            onClick={handleDestroyDao}>
            Destroy DAO
          </button>
        </div>
      </div>
      <div className='flex flex-col justify-end border-t-2 border-dashed'>
        <div className='mt-3 flex flex-col '>
          <p className='text-neutral-focus'>{`Council's multisignature address:`}</p>
          <p className='w-full truncate bg-[#403945]'>
            {currentDao?.daoOwnerAddress}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DaoDashboard;
