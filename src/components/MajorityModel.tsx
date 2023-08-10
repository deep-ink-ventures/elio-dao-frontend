import useElioDao from '@/hooks/useElioDao';
import type { MajorityModelValues } from '@/stores/elioStore';
import useElioStore from '@/stores/elioStore';
import { ErrorMessage } from '@hookform/error-message';
import BigNumber from 'bignumber.js';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';

const MajorityModel = () => {
  const [currentDao, isTxnProcessing, currentWalletAccount] = useElioStore(
    (s) => [s.currentDao, s.isTxnProcessing, s.currentWalletAccount]
  );

  const { issueTokenSetConfig } = useElioDao();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<MajorityModelValues>({
    defaultValues: {
      tokensToIssue: BigNumber(0),
      // proposalTokensCost: 0,
      minimumThresholdPercentage: 10,
      proposalDurationInDays: 1,
    },
  });

  const watchMinimumThresholdPercentage = watch('minimumThresholdPercentage');

  const onSubmit: SubmitHandler<MajorityModelValues> = async (
    data: MajorityModelValues
  ) => {
    if (!currentWalletAccount?.publicKey || !currentDao?.daoId) {
      return;
    }
    await issueTokenSetConfig({
      daoId: currentDao.daoId,
      daoOwnerPublicKey: currentWalletAccount.publicKey,
      proposalDuration: data.proposalDurationInDays * 120,
      // proposalTokenDeposit: BigNumber(data.proposalTokensCost),
      minimumThreshold: BigNumber(
        data.minimumThresholdPercentage / 100
      ).multipliedBy(data.tokensToIssue),
      tokenSupply: data.tokensToIssue,
    });
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
                be the DAO token symbol (current max is 1,000,000,000)
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
                    max: { value: 1000000000, message: 'Max is 1,000,000,000' },
                    setValueAs: (tokens) => {
                      const bnTokens = BigNumber(tokens);
                      return bnTokens;
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
          {/* <div className='min-w-full'>
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
          </div> */}
          <div className='min-w-full'>
            <h4 className='ml-1'>
              Minimum Majority Threshold{' '}
              <span className='text-lg font-medium text-red-600'>*</span>
            </h4>
            <p className='mb-2 ml-1 text-sm'>
              {`DAO proposals will pass only if (votes in favor + votes against) >= (minimum majority threshold * total token supply)`}
            </p>
            <div className='flex justify-between'>
              <div className='w-[78%]'>
                <div className='flex h-12 items-center justify-evenly rounded-[10px] border-[0.3px] border-neutral-focus bg-base-50'>
                  <p className='opacity-80'>
                    {watchMinimumThresholdPercentage}%
                  </p>
                  <input
                    type='range'
                    className='range range-primary h-3 w-[75%]'
                    min={0}
                    max={25}
                    value={watchMinimumThresholdPercentage}
                    {...register('minimumThresholdPercentage')}
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
              Number of 10 Minutes the proposal will be up for voting.
            </p>
            <div className='relative w-[175px] flex-col'>
              <input
                className='input-primary input pr-16'
                type='number'
                placeholder='0'
                {...register('proposalDurationInDays', {
                  required: 'Required',
                  min: { value: 1, message: 'Minimum is 1' },
                })}
              />
              <ErrorMessage
                errors={errors}
                name='proposalDurationInDays'
                render={({ message }) => (
                  <p className='ml-2 mt-1 text-error'>{message}</p>
                )}
              />
              <div className='absolute left-[7.4em] top-3 opacity-70'>
                10 Min
              </div>
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
