import { useMemo } from 'react';

import { DAO_UNITS } from '@/config';
import type { ProposalDetail } from '@/stores/elioStore';
import useElioStore from '@/stores/elioStore';
import { getProposalEndTime } from '@/utils';
import BigNumber from 'bignumber.js';

export const statusColors = {
  Active: 'bg-neutral text-base-100',
  Counting: 'bg-secondary text-base-100',
  Accepted: 'bg-accent text-base-100',
  Rejected: 'bg-error',
  Faulty: 'bg-error',
  undefined: 'bg-neutral text-base-100',
};

const ProposalCard = (props: { p: ProposalDetail }) => {
  const [currentDao] = useElioStore((s) => [s.currentDao]);
  const [currentBlockNumber] = useElioStore((s) => [s.currentBlockNumber]);

  const dhmMemo = useMemo(() => {
    return props.p?.birthBlock &&
      currentBlockNumber &&
      currentDao?.proposalDuration
      ? getProposalEndTime(
          currentBlockNumber,
          props.p?.birthBlock,
          currentDao?.proposalDuration
        )
      : { d: 0, h: 0, m: 0 };
  }, [props.p, currentBlockNumber, currentDao?.proposalDuration]);

  const inFavorPercentageMemo = useMemo(() => {
    const inFavorVotes = props.p?.inFavor || BigNumber(0);
    const againstVotes = props.p?.against || BigNumber(0);
    const totalVotes = inFavorVotes.plus(againstVotes);
    const inFavorPercentage = inFavorVotes.isZero()
      ? BigNumber(0)
      : inFavorVotes.multipliedBy(BigNumber(100)).dividedBy(totalVotes);
    return inFavorPercentage.toString();
  }, [props.p]);

  const againstPercentageMemo = useMemo(() => {
    const inFavorVotes = props.p?.inFavor || BigNumber(0);
    const againstVotes = props.p?.against || BigNumber(0);
    const totalVotes = inFavorVotes.plus(againstVotes);
    const againstPercentage = againstVotes.isZero()
      ? BigNumber(0)
      : againstVotes.multipliedBy(BigNumber(100)).dividedBy(totalVotes);
    return againstPercentage.toString();
  }, [props.p]);

  const proposalIsRunning = useMemo(() => {
    if (
      (props.p?.birthBlock || 0) + (currentDao?.proposalDuration || 14400) >
      (currentBlockNumber || 0)
    ) {
      return true;
    }
    return false;
  }, [props.p, currentDao, currentBlockNumber]);

  return (
    <div className='min-h-[180px] rounded-[8px] border-[0.3px] border-neutral-focus p-4 hover:cursor-pointer hover:outline'>
      <div className='flex flex-col gap-y-3'>
        <div className='mb-3 flex justify-between'>
          <div>
            <p className='mb-1 text-sm'>Proposal ID: {props.p.proposalId}</p>
            <h3 className='text-2xl'>{props.p.proposalName}</h3>
          </div>
          <div className='flex'>
            {proposalIsRunning ? (
              <div className='mr-4 flex gap-2'>
                Ends in
                <div className='flex gap-2'>
                  <div className='bg-base-card h-6 px-2'>{dhmMemo.d}d</div>:
                  <div className='bg-base-card h-6 px-2'>{dhmMemo.h}h</div>:
                  <div className='bg-base-card h-6 px-2'>{dhmMemo.m}m</div>
                </div>
              </div>
            ) : (
              <div className='mr-4 flex flex-col'>
                <p>Ended </p>
              </div>
            )}
            <div
              className={`rounded-lg ${
                !props.p?.status ? '' : statusColors[`${props.p?.status}`]
              } h-7 rounded-3xl px-3 py-1 text-center text-sm`}>
              {props.p?.status}
            </div>
          </div>
        </div>
        <div className='flex justify-between'>
          <div className='flex w-[100%] flex-col pr-6'>
            <div className='relative mb-2 flex w-full justify-between'>
              <div
                className={`h-7 bg-[#403945]`}
                style={{ width: `${inFavorPercentageMemo.toString()}%` }}>
                <div className='absolute p-1 text-sm'>
                  In Favor ({' '}
                  {props.p?.inFavor
                    ? props.p.inFavor.div(BigNumber(DAO_UNITS)).toString()
                    : BigNumber(0).toString()}
                  )
                </div>
              </div>
              <p className='ml-1'>{`${inFavorPercentageMemo.toString()}% `}</p>
            </div>
            <div className='relative mb-2 flex w-full justify-between'>
              <div
                className={`h-7 bg-[#403945]`}
                style={{ width: `${againstPercentageMemo.toString()}%` }}>
                <div className='absolute p-1 text-sm'>
                  <p className=''>
                    Against (
                    {props.p?.against
                      ? props.p.against.div(BigNumber(DAO_UNITS)).toString()
                      : BigNumber(0).toString()}
                    )
                  </p>
                </div>
              </div>
              <p className='ml-1'>{`${againstPercentageMemo.toString()}%`}</p>
            </div>
          </div>
          <div>
            {props.p.status === 'Active' && proposalIsRunning ? (
              <button className='btn-primary btn w-28'>Vote</button>
            ) : null}
            {props.p.status === 'Active' && !proposalIsRunning ? (
              <button className='btn-primary btn w-28'>Finalize</button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalCard;
