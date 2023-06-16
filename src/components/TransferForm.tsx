import { ErrorMessage } from '@hookform/error-message';
import { useEffect } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';

import { DAO_UNITS } from '@/config';
import type { TransferFormValues } from '@/stores/elioStore';
import useElioStore from '@/stores/elioStore';
import { uiTokens } from '@/utils';
import BigNumber from 'bignumber.js';

const TransferForm = (props: { assetId: number; daoId: string }) => {
  const [isTxnProcessing, currentWalletAccount] = useElioStore((s) => [
    s.isTxnProcessing,
    s.currentWalletAccount,
  ]);
  const daoTokenBalance = new BigNumber(100);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitSuccessful },
    setValue,
  } = useForm<TransferFormValues>();

  const onSubmit: SubmitHandler<TransferFormValues> = async (
    data: TransferFormValues
  ) => {
    console.log(data);
  };

  const buttonText = () => {
    if (!currentWalletAccount) {
      return 'Please Connect Wallet';
    }
    if (isTxnProcessing) {
      return 'Processing';
    }
    return 'Transfer';
  };

  useEffect(() => {
    setValue('assetId', props.assetId);
    if (isSubmitSuccessful) {
      reset(
        {
          assetId: props.assetId,
          toAddress: '',
          amount: new BigNumber(0),
        },
        { keepErrors: true }
      );
    }
  });

  return (
    <div>
      <div>
        <div>
          {`Your current ${props.daoId} token balance is ${
            daoTokenBalance
              ? uiTokens(daoTokenBalance, 'dao', props.daoId)
              : '0'
          }`}
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className='mb-3'>
          <input
            type='text'
            className='input-bordered input-primary input'
            placeholder='Recipient Address'
            {...register('toAddress', {
              required: 'Required',
              // fixme
            })}
          />
          <ErrorMessage
            errors={errors}
            name='toAddress'
            render={({ message }) => (
              <p className='ml-2 mt-1 text-error'>{message}</p>
            )}
          />
        </div>
        <div className='mb-3'>
          <input
            type='number'
            className='input-bordered input-primary input'
            placeholder='Amount'
            {...register('amount', {
              valueAsNumber: true,
              required: 'Required',
              min: {
                value: 0.000001,
                message: 'The Amount is zero or too small',
              },
              setValueAs: (tokens) => {
                return new BigNumber(tokens * DAO_UNITS);
              },
            })}
          />
          <ErrorMessage
            errors={errors}
            name='amount'
            render={({ message }) => <p>{message}</p>}
          />
        </div>
        <div className='mb-3'>
          <button
            type='submit'
            // disabled={!currentWalletAccount}
            className={`btn-primary btn 
          ${isTxnProcessing ? `loading` : ``}
          `}
            disabled={!currentWalletAccount}>
            {buttonText()}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TransferForm;
