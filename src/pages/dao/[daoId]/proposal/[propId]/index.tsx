import useElioDao from '@/hooks/useElioDao';
import useElioStore from '@/stores/elioStore';
import BigNumber from 'bignumber.js';
import cn from 'classnames';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactHtmlParser from 'react-html-parser';

import FaultyModal from '@/components/FaultyModal';
import FaultyReportsModal from '@/components/FaultyReportsModal';
import Spinner from '@/components/Spinner';
import Tooltip from '@/components/Tooltip';
import { statusColors } from '@/components/TransactionBadge';
import WalletConnect from '@/components/WalletConnect';
import { BLOCK_TIME, DAO_UNITS } from '@/config';
import { ProposalStatus } from '@/services/proposals';
import ThumbDown from '@/svg/components/thumbdown';
import ThumbUp from '@/svg/components/thumbup';
import MainLayout from '@/templates/MainLayout';
import { getProposalEndTime, uiTokens } from '@/utils';

import alert from '@/svg/alert.svg';
import arrowLeft from '@/svg/arrowLeft.svg';

const Proposal = () => {
  const router = useRouter();
  const { daoId, propId } = router.query;
  const [voteSelection, setVoteSelection] = useState<
    'In Favor' | 'Against' | null
  >(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isStatusRefreshing, setIsStatusRefreshing] = useState(false);
  const [
    currentWalletAccount,
    daoTokenBalance,
    currentDao,
    p,
    currentBlockNumber,
    isFaultyModalOpen,
    currentProposalFaultyReports,
    isTxnProcessing,
    updateDaoPage,
    updateIsFaultyModalOpen,
    fetchProposalFaultyReports,
    updateIsFaultyReportsOpen,
    updateCurrentBlockNumber,
    fetchBlockNumber,
    fetchProposalDB,
    fetchDaoDB,
    fetchDaoTokenBalanceFromDB,
    updateIsTxnProcessing,
  ] = useElioStore((s) => [
    s.currentWalletAccount,
    s.daoTokenBalance,
    s.currentDao,
    s.currentProposal,
    s.currentBlockNumber,
    s.isFaultyModalOpen,
    s.currentProposalFaultyReports,
    s.isTxnProcessing,
    s.updateDaoPage,
    s.updateIsFaultyModalOpen,
    s.fetchProposalFaultyReports,
    s.updateIsFaultyReportsOpen,
    s.updateCurrentBlockNumber,
    s.fetchBlockNumber,
    s.fetchProposalDB,
    s.fetchDaoDB,
    s.fetchDaoTokenBalanceFromDB,
    s.updateIsTxnProcessing,
  ]);

  const { vote, finalizeProposal } = useElioDao();

  const fetchDaoTokenCb = useCallback(() => {
    if (currentDao?.daoAssetAddress && currentWalletAccount) {
      fetchDaoTokenBalanceFromDB(
        currentDao?.daoId,
        currentWalletAccount.publicKey
      );
    }
  }, [currentDao, currentWalletAccount]);

  const dhmMemo = useMemo(() => {
    return p?.birthBlock && currentBlockNumber && currentDao?.proposalDuration
      ? getProposalEndTime(
          currentBlockNumber,
          p.birthBlock,
          currentDao?.proposalDuration
        )
      : { d: 0, h: 0, m: 0 };
  }, [p, currentBlockNumber, currentDao?.proposalDuration]);

  const inFavorPercentageMemo = useMemo(() => {
    const inFavorVotes = p?.inFavor || BigNumber(0);
    const againstVotes = p?.against || BigNumber(0);
    const totalVotes = inFavorVotes.plus(againstVotes);
    const inFavorPercentage = inFavorVotes.isZero()
      ? BigNumber(0)
      : inFavorVotes.multipliedBy(BigNumber(100)).dividedBy(totalVotes);
    return inFavorPercentage.toString();
  }, [p]);

  const againstPercentageMemo = useMemo(() => {
    const inFavorVotes = p?.inFavor || BigNumber(0);
    const againstVotes = p?.against || BigNumber(0);
    const totalVotes = inFavorVotes.plus(againstVotes);
    const againstPercentage = againstVotes.isZero()
      ? BigNumber(0)
      : againstVotes.multipliedBy(BigNumber(100)).dividedBy(totalVotes);
    return againstPercentage.toString();
  }, [p]);

  const proposalIsRunning = useMemo(() => {
    if (
      (p?.birthBlock || 0) + (currentDao?.proposalDuration || 14400) >
      (currentBlockNumber || 0)
    ) {
      return true;
    }
    return false;
  }, [p, currentDao, currentBlockNumber]);

  const updateIsStartModalOpen = useElioStore((s) => s.updateIsStartModalOpen);

  const handleStartModal = () => {
    updateIsStartModalOpen(true);
  };

  const handleVote = () => {
    if (!daoId || !propId || !voteSelection) {
      return;
    }
    let isInFavor = true;
    if (voteSelection === 'Against') {
      isInFavor = false;
    }
    vote(daoId as string, Number(propId), isInFavor, () => {
      setVoteSelection(null);
      setIsRefreshing(true);
      updateIsTxnProcessing(false);
      setTimeout(() => {
        fetchProposalDB(daoId as string, propId as string);
      }, 5000);
      setTimeout(() => {
        setIsRefreshing(false);
      }, 5500);
    });
  };

  const handleBack = () => {
    updateDaoPage('proposals');
    router.push(`/dao/${daoId as string}/`);
  };

  const handleVoteSelection = (e: any) => {
    if (e.target.textContent === 'In Favor') {
      setVoteSelection('In Favor');
    } else if (e.target.textContent === 'Against') {
      setVoteSelection('Against');
    }
  };

  const handleFinalize = () => {
    if (!daoId || !propId) {
      return;
    }

    finalizeProposal(daoId as string, Number(propId as string), () => {
      setIsStatusRefreshing(true);
      setTimeout(() => {
        fetchProposalDB(daoId as string, propId as string);
      }, 5000);
      setTimeout(() => {
        setIsStatusRefreshing(false);
      }, 5000);
    });
  };

  useEffect(() => {
    if (daoId && propId && currentDao) {
      const timer = setTimeout(() => {
        fetchProposalDB(daoId as string, propId as string);
        fetchDaoDB(daoId as string);
        fetchProposalFaultyReports(propId as string);
        fetchBlockNumber();
        // eslint-disable-next-line
        return () => clearTimeout(timer);
      }, 500);
    }
  }, [daoId, propId, fetchProposalFaultyReports, currentWalletAccount]);

  useEffect(() => {
    fetchDaoTokenCb();
  }, [fetchDaoTokenCb]);

  useEffect(() => {
    if (!currentBlockNumber) {
      return;
    }
    const timeout = setTimeout(() => {
      updateCurrentBlockNumber(currentBlockNumber + 1);
    }, BLOCK_TIME * 1000);
    // eslint-disable-next-line
    return () => clearTimeout(timeout);
  }, [currentBlockNumber, updateCurrentBlockNumber]);

  const displayVoteButton = () => {
    if (!currentWalletAccount) {
      return (
        <WalletConnect text={'Connect To Vote'} onClose={handleStartModal} />
      );
    }

    if (!daoTokenBalance || !daoTokenBalance.gt(BigNumber(0))) {
      return (
        <button className='btn' disabled>
          {`You Can't Vote. No Tokens`}
        </button>
      );
    }

    return (
      <Tooltip
        placement='top'
        content={`Please note, that creating a proposal requires a one-time deposit of 100 XLM`}>
        <button
          className={cn('btn-primary btn min-w-[250px]', {
            loading: isTxnProcessing,
          })}
          onClick={handleVote}>
          Vote
        </button>
      </Tooltip>
    );
  };

  return (
    <MainLayout
      title='ElioDAO - DAO Platform On Stellar Soroban'
      description='ElioDAO - Create a DAO'>
      <div
        className='mt-5 flex w-[65px] items-center justify-between hover:cursor-pointer hover:underline'
        onClick={handleBack}>
        <Image src={arrowLeft} width={13} height={7} alt='arrow-left' />
        <div>Back</div>
      </div>
      <div className='mt-5 flex min-h-[500px] justify-between gap-x-4'>
        <div className='container flex min-h-[640px] basis-3/4 justify-center p-6'>
          {!p || p.proposalId !== propId ? (
            <div className='mt-10'>
              {' '}
              <Spinner />
            </div>
          ) : (
            <div className='flex w-full flex-col gap-y-3'>
              <div className='flex justify-between'>
                <div className='mr-4'>
                  <p className='text-sm'>Proposal ID: {p?.proposalId}</p>
                  <h3 className='text-2xl'>{p?.proposalName}</h3>
                </div>
                <div className='flex'>
                  {proposalIsRunning ? (
                    <div className='mr-4 flex gap-2'>
                      Ends in
                      <div className='flex gap-2'>
                        <div className='bg-base-card h-6 px-2'>
                          {dhmMemo.d}d
                        </div>
                        :
                        <div className='bg-base-card h-6 px-2'>
                          {dhmMemo.h}h
                        </div>
                        :
                        <div className='bg-base-card h-6 px-2'>
                          {dhmMemo.m}m
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className='mr-4 flex flex-col'>
                      <p>Ended </p>
                    </div>
                  )}
                  {isStatusRefreshing ? (
                    <Spinner size='20' />
                  ) : (
                    <div
                      className={`rounded-lg ${
                        !p?.status ? '' : statusColors[`${p?.status}`]
                      } h-7 rounded-3xl px-3 py-1 text-center text-sm`}>
                      {p?.status}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <p className='w-full truncate break-words rounded-xl border-[0.3px] border-neutral-focus p-4'>
                  <span className='font-semibold '>Discussion Link:</span>
                  <span className='ml-2 text-sm underline'>
                    <a
                      href={p?.link || ''}
                      target='_blank'
                      rel='external nofollow noreferrer'>
                      {p?.link || ''}
                    </a>
                  </span>
                </p>
              </div>
              <div className='description-display'>
                {ReactHtmlParser(p?.description || '')}
              </div>
            </div>
          )}
        </div>
        <div className='flex min-h-[640px] min-w-[300px] basis-1/4 flex-col items-center gap-y-4'>
          {currentProposalFaultyReports &&
          currentProposalFaultyReports?.length > 0 ? (
            <div className='container flex min-h-[100px] flex-col items-center justify-center p-3 text-center'>
              <div className='mb-4 flex items-center'>
                <div className='mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-warning'>
                  <Image src={alert} height={24} width={24} alt='alert' />
                </div>
                <div className='w-[200px] text-left text-sm'>
                  This proposal has been reported as faulty by one or more DAO
                  members
                </div>
              </div>
              {currentWalletAccount &&
              (currentDao?.daoCreatorAddress ===
                currentWalletAccount.publicKey ||
                currentDao?.daoOwnerAddress ===
                  currentWalletAccount.publicKey) ? (
                <div>
                  <button
                    className='btn-primary btn mb-2'
                    onClick={() => {
                      updateIsFaultyReportsOpen(true);
                    }}>
                    See Reports
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
          <FaultyReportsModal proposalId={propId as string} />

          {p?.status === ProposalStatus.Active && !proposalIsRunning ? (
            <div className='container flex min-h-[100px] flex-col items-center justify-center p-4 text-center'>
              <p>Please finalize proposal to update its status</p>
              <button
                className={`btn-primary btn my-3 ${
                  isTxnProcessing ? 'loading' : ''
                } ${currentWalletAccount ? '' : 'btn-disabled'}`}
                onClick={handleFinalize}>
                Finalize
              </button>
            </div>
          ) : null}

          {p?.status === ProposalStatus.Active && proposalIsRunning ? (
            <div className='container flex flex-col items-center justify-center gap-y-2 p-4'>
              <p className='mb-1 text-center text-xl'>Your Voting Power</p>
              <div className='flex h-[80px] w-[240px] items-center justify-center rounded-xl bg-base-50 px-4'>
                <div className='px-5 text-center text-sm'>
                  {!currentWalletAccount?.publicKey ? (
                    <p className=''>Connect Wallet To View Tokens</p>
                  ) : (
                    <div className='flex flex-col'>
                      <p>You have</p>
                      <p> {uiTokens(daoTokenBalance, 'dao', p?.daoId)} </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {p?.status === ProposalStatus.Active && proposalIsRunning ? (
            <div className='container flex min-w-[250px] flex-col items-center justify-center gap-y-2 rounded-xl p-4'>
              <p className='text-xl font-semibold text-primary'>
                Cast Your Vote
              </p>
              {currentWalletAccount ? (
                <div className='flex flex-col gap-y-2'>
                  <div
                    className={`btn-vote group flex min-w-[250px] items-center justify-center rounded-3xl border-2 border-neutral-focus bg-transparent hover:cursor-pointer hover:bg-neutral-focus hover:text-primary-content ${
                      voteSelection === 'In Favor'
                        ? ' border-success font-semibold text-success outline  hover:bg-transparent hover:text-success'
                        : 'text-white'
                    } ${voteSelection === 'Against' ? 'brightness-50' : ''}`}
                    onClick={(e) => {
                      handleVoteSelection(e);
                    }}>
                    <ThumbUp
                      className={cn('mr-2', {
                        '[&_path]:stroke-success': voteSelection === 'In Favor',
                        '[&_path]:group-hover:stroke-primary-content':
                          voteSelection !== 'In Favor',
                      })}
                    />
                    In Favor
                  </div>
                  <div
                    className={`btn-vote group flex min-w-[250px] items-center justify-center rounded-3xl border-2 border-neutral-focus bg-transparent hover:cursor-pointer hover:bg-neutral-focus hover:text-primary-content ${
                      voteSelection === 'Against'
                        ? 'border-secondary text-secondary outline hover:bg-transparent hover:text-secondary'
                        : 'text-white '
                    } ${voteSelection === 'In Favor' ? 'brightness-50' : ''}`}
                    onClick={(e) => {
                      handleVoteSelection(e);
                    }}>
                    <ThumbDown
                      className={cn('mr-2', {
                        '[&_path]:stroke-secondary':
                          voteSelection === 'Against',
                        '[&_path]:group-hover:stroke-primary-content':
                          voteSelection !== 'Against',
                      })}
                    />
                    Against
                  </div>
                </div>
              ) : null}
              <div>{displayVoteButton()}</div>
            </div>
          ) : null}

          <div className='container flex min-w-[250px] flex-col items-center gap-y-3 p-4'>
            <p className='text-xl'>
              Voting{' '}
              {p?.status === 'Active' && proposalIsRunning
                ? 'Progress'
                : 'Result'}
            </p>
            {isRefreshing ? (
              <Spinner />
            ) : (
              <div className='flex w-[100%] flex-col pr-6'>
                <div className='relative mb-2 flex w-full justify-between'>
                  <div
                    className={`h-7 bg-[#403945]`}
                    style={{ width: `${inFavorPercentageMemo}%` }}>
                    <div className='absolute p-1 text-sm'>
                      In Favor (
                      {p?.inFavor
                        ? p.inFavor.dividedBy(BigNumber(DAO_UNITS)).toString()
                        : BigNumber(0).toString()}
                      )
                    </div>
                  </div>
                  <p className='ml-1'>{`${inFavorPercentageMemo}% `}</p>
                </div>
                <div className='relative mb-2 flex w-full justify-between'>
                  <div
                    className={`h-7 bg-[#403945]`}
                    style={{ width: `${againstPercentageMemo}%` }}>
                    <div className='absolute p-1 text-sm'>
                      <p className=''>
                        Against (
                        {p?.against
                          ? p.against.dividedBy(BigNumber(DAO_UNITS)).toString()
                          : BigNumber(0).toString()}
                        )
                      </p>
                    </div>
                  </div>
                  <p className='ml-1'>{`${againstPercentageMemo}%`}</p>
                </div>
              </div>
            )}
          </div>
          {p?.status === 'Active' ? (
            <div className='container flex min-w-[250px] flex-col items-center gap-y-3 p-4'>
              <p className='text-xl'>Report</p>
              <p className='text-sm'>
                {`If you find this proposal does not align with the organization's
              goals and priorities, you can report the proposal as faulty and
              council members will investigate this proposal`}
              </p>
              {currentProposalFaultyReports &&
              currentProposalFaultyReports?.length >= 3 ? (
                <div className='rounded-xl bg-base-50 p-4 text-center text-sm'>
                  Faulty reports maximum has been reached. Council members will
                  review this proposal shortly.
                </div>
              ) : (
                <button
                  className={`btn ${
                    !currentWalletAccount ? 'btn-disabled' : ''
                  }`}
                  onClick={() => {
                    updateIsFaultyModalOpen(!isFaultyModalOpen);
                  }}>
                  Report This Proposal As Faulty
                </button>
              )}
            </div>
          ) : null}
          <FaultyModal propId={propId as string} daoId={daoId as string} />
        </div>
      </div>
    </MainLayout>
  );
};

export default Proposal;
