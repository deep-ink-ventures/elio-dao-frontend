import useElioDao from '@/hooks/useElioDao';
import type { CreateDaoData } from '@/stores/elioStore';
import useElioStore from '@/stores/elioStore';
import { ErrorMessage } from '@hookform/error-message';
import Modal from 'antd/lib/modal';
import { useEffect, useState } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';

// import { NATIVE_UNITS } from '../config/index';

const CreateDaoModal = () => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitSuccessful },
  } = useForm<CreateDaoData>();
  const [hasEnoughTokens, _setHasEnoughTokens] = useState(true);
  const [isStartModalOpen, isTxnProcessing, currentWalletAccount] =
    useElioStore((s) => [
      s.isStartModalOpen,
      s.isTxnProcessing,
      s.currentWalletAccount,
    ]);

  const { createDao } = useElioDao();
  const [updateIsStartModalOpen] = useElioStore((s) => [
    s.updateIsStartModalOpen,
  ]);

  const watchName = watch('daoName', '');
  const watchId = watch('daoId', '');

  const onSubmit: SubmitHandler<CreateDaoData> = async (
    data: CreateDaoData
  ) => {
    console.log(data);
    if (!currentWalletAccount) {
      return;
    }

    try {
      await createDao(data);
    } catch (err) {
      console.log('create dao', err);
    }

    updateIsStartModalOpen(false);
  };

  useEffect(() => {
    if (isSubmitSuccessful) {
      reset();
    }
  });

  const handleCancel = () => {
    updateIsStartModalOpen(false);
  };

  const alert = (hasTokens: boolean | null) => {
    if (hasTokens) {
      return (
        <div className='alert alert-info shadow-lg'>
          <div>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
              className='h-6 w-6 shrink-0 stroke-current'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'></path>
            </svg>
            <p>
              <span className='font-bold'>{`10 Tokens `}</span>will be reserved
              upon creation of your DAO. The reserved tokens will be refunded
              when the DAO is destroyed.
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className='alert alert-error shadow-lg'>
        <div>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='h-6 w-6 shrink-0 stroke-current'
            fill='none'
            viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
          <p>
            Sorry you need at least <span className='font-bold'>10 tokens</span>{' '}
            to create a DAO. You will get them back if you destroy the DAO.
          </p>
        </div>
      </div>
    );
  };

  return (
    <>
      <Modal
        open={isStartModalOpen}
        confirmLoading={isTxnProcessing}
        wrapClassName='a-modal-bg'
        className='a-modal'
        onCancel={handleCancel}
        footer={null}
        width={615}
        zIndex={99}>
        <div className='flex flex-col items-center gap-y-6 px-16'>
          <div className='text-center'>
            <h2 className='text-primary'>{`Let's get started!`}</h2>
            <p className='px-20'>
              {`Please choose DAO NAME and DAO ID wisely. They CANNOT be changed.`}
            </p>
          </div>
          {alert(hasEnoughTokens)}
          <div
            className={`flex w-full items-center ${
              !hasEnoughTokens ? 'text-neutral/30' : null
            }`}>
            <form onSubmit={handleSubmit(onSubmit)} className='min-w-full'>
              <div className='mb-8 flex flex-col items-center gap-y-8'>
                <div className='min-w-full'>
                  <div className='flex items-end justify-between'>
                    <p className='mb-1 ml-2'>
                      DAO Name{' '}
                      <span className='text-lg font-medium text-red-600'>
                        *
                      </span>
                    </p>
                  </div>
                  <div className='relative'>
                    <input
                      className={`input ${
                        watchName.length > 32 || errors.daoName
                          ? 'input-error'
                          : 'input-primary'
                      }`}
                      type='text'
                      placeholder='e.g. Apple DAO'
                      disabled={!hasEnoughTokens}
                      {...register('daoName', {
                        required: 'Required',
                        maxLength: { value: 32, message: 'Max length is 32' },
                        minLength: { value: 3, message: 'Minimum length is 3' },
                      })}
                    />
                    <ErrorMessage
                      errors={errors}
                      name='daoName'
                      render={({ message }) => (
                        <p className='ml-2 mt-1 text-error'>{message}</p>
                      )}
                    />
                    <p
                      className={`absolute right-2 top-2 opacity-60 ${
                        watchName.length > 32 ? 'text-error' : null
                      }`}>
                      {watchName.length}/32
                    </p>
                  </div>
                </div>
                <div className='min-w-full'>
                  <div className='flex items-end justify-between'>
                    <p className='mb-1 ml-2'>
                      DAO ID{' '}
                      <span className='text-lg font-medium text-red-600'>
                        *
                      </span>
                    </p>
                    <p className='mb-1 ml-2 text-sm'>
                      Choose from capital A-Z and numbers 0-9(no space)
                    </p>
                  </div>
                  <div className='relative'>
                    {/* fixme: Pre fetch all dao names and validate if the dao name exists */}
                    <input
                      className={`input ${
                        watchId.length > 8 || errors.daoId
                          ? 'input-error'
                          : 'input-primary'
                      }`}
                      type='text'
                      placeholder='e.g. APPLE'
                      disabled={!hasEnoughTokens}
                      {...register('daoId', {
                        required: 'Required',
                        maxLength: { value: 8, message: 'Max Length is 8' },
                        minLength: { value: 3, message: 'Minimum length is 3' },
                        pattern: {
                          value: /^[A-Z0-9]+$/,
                          message: 'Only capital A-Z or 0-9(no whitespace)',
                        },
                      })}
                    />
                    <ErrorMessage
                      errors={errors}
                      name='daoId'
                      render={({ message }) => (
                        <p className='ml-2 mt-1 text-error'>{message}</p>
                      )}
                    />
                    <p
                      className={`absolute right-2 top-2 opacity-60 ${
                        watchId.length > 8 ? 'text-error' : null
                      }`}>
                      {watchId.length}/8
                    </p>
                  </div>
                </div>
              </div>
              <div className='flex justify-center'>
                <button
                  className={`btn-primary btn w-96 ${
                    isTxnProcessing ? 'loading' : null
                  }`}
                  type='submit'
                  disabled={!hasEnoughTokens}>
                  {isTxnProcessing ? 'Processing' : 'Submit and Sign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default CreateDaoModal;
