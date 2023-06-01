import { ErrorMessage } from '@hookform/error-message';
import BN from 'bn.js';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';

import { DAO_UNITS } from '@/config';
import type { MajorityModelValues } from '@/stores/elioStore';
import useElioStore from '@/stores/elioStore';

const MajorityModel = (props: { daoId: string | null }) => {
  const [currentDao, isTxnProcessing] = useElioStore(
    (s) => [s.currentDao, s.isTxnProcessing, s.currentWalletAccount]
  );

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<MajorityModelValues>({
    defaultValues: {
      tokensToIssue: new BN(0),
      proposalTokensCost: 0,
      minimumMajority: 10,
      votingDays: 1,
    },
  });

  const watchMinimumMajority = watch('minimumMajority');

  const onSubmit: SubmitHandler<MajorityModelValues> = async (
    data: MajorityModelValues
  ) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='min-w-full'>
      <div className='card flex w-full items-center justify-center pt-6 hover:border-none hover:brightness-100'>
        <div className='mb-8 flex flex-col items-center gap-y-8 px-32'>
          <div className='text-center'>
            Majority Vote allows members to make decisions collectively. With a
            majority vote system, members can cast their votes on proposals, and
            the outcome is determined by the number of votes received.
          </div>
          <div className='min-w-full'>
            <div className='mb-2'>
              <h4 className='ml-1'>
                Issue DAO Tokens{' '}
                <span className='text-lg font-medium text-red-600'>*</span>
              </h4>
              <p className='ml-1 text-sm'>
                <span className='text-primary'>{currentDao?.daoId}</span> will
                be the DAO token symbol (current max is 900,000,000)
              </p>
            </div>
            <div>
              <div className='relative w-[320px]'>
                <input
                  type='number'
                  placeholder='0'
                  className='input-primary input pr-24'
                  {...register('tokensToIssue', {
                    required: 'Required',
                    min: { value: 1, message: 'Minimum is 1' },
                    max: { value: 900000000, message: 'Max is 900,000,000' },
                    setValueAs: (tokens) => {
                      const bnTokens = new BN(tokens);
                      return bnTokens.mul(new BN(DAO_UNITS));
                    },
                  })}
                />
                <ErrorMessage
                  errors={errors}
                  name='tokensToIssue'
                  render={({ message }) => (
                    <p className='ml-2 mt-1 text-error'>{message}</p>
                  )}
                />
                <div className='absolute left-[252px] top-3 opacity-70'>
                  Tokens
                </div>
              </div>
            </div>
          </div>
          <div className='min-w-full'>
            <h4 className='ml-1'>
              Proposal Token Cost{' '}
              <span className='text-lg font-medium text-red-600'>*</span>
            </h4>
            <p className='mb-2 ml-1 text-sm'>
              Number of tokens needed to create a proposal
            </p>
            <div className='relative w-[175px]'>
              <input
                className={` input pr-20 ${
                  errors.proposalTokensCost ? 'input-error' : 'input-primary'
                }`}
                type='number'
                placeholder='0'
                {...register('proposalTokensCost', {
                  required: 'Required',
                  min: { value: 1, message: 'Minimum is 1' },
                  max: { value: 1000000, message: 'Maximum is 1 Million' },
                })}
              />
              <ErrorMessage
                errors={errors}
                name='proposalTokensCost'
                render={({ message }) => (
                  <p className='ml-2 mt-1 text-error'>{message}</p>
                )}
              />
              <div className='absolute left-[6.5em] top-3 opacity-70'>
                Tokens
              </div>
            </div>
          </div>
          <div className='min-w-full'>
            <h4 className='ml-1'>
              Minimum Majority Threshold{' '}
              <span className='text-lg font-medium text-red-600'>*</span>
            </h4>
            <p className='mb-2 ml-1 text-sm'>
              {`DAO proposals will pass only if (votes in favor - votes against) >= (minimum majority threshold * total token supply)`}
            </p>
            <div className='flex justify-between'>
              <div className='w-[78%]'>
                <div className='flex h-12 items-center justify-evenly rounded-[10px] border-[0.3px] border-neutral-focus bg-base-50'>
                  <p className='opacity-80'>{watchMinimumMajority}%</p>
                  <input
                    type='range'
                    className='range range-primary h-3 w-[75%]'
                    min={0}
                    max={25}
                    value={watchMinimumMajority}
                    {...register('minimumMajority')}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className='min-w-full'>
            <h4 className='ml-1'>
              Proposal Duration{' '}
              <span className='text-lg font-medium text-red-600'>*</span>
            </h4>
            <p className='mb-2 ml-1 text-sm'>
              Number of days the proposal will be up for voting.
            </p>
            <div className='relative w-[175px] flex-col'>
              <input
                className='input-primary input pr-16'
                type='number'
                placeholder='0'
                {...register('votingDays', {
                  required: 'Required',
                  min: { value: 1, message: 'Minimum is 1' },
                })}
              />
              <ErrorMessage
                errors={errors}
                name='votingDays'
                render={({ message }) => (
                  <p className='ml-2 mt-1 text-error'>{message}</p>
                )}
              />
              <div className='absolute left-[7.4em] top-3 opacity-70'>Days</div>
            </div>
          </div>
        </div>
      </div>
      <div className='mt-4 flex w-full justify-end'>
        <button
          className={`btn-primary btn mr-3 w-48 ${
            isTxnProcessing ? 'loading' : null
          }`}
          type='submit'>
          {isTxnProcessing ? 'Processing' : 'Submit and Sign'}
        </button>
      </div>
    </form>
  );
};

export default MajorityModel;
