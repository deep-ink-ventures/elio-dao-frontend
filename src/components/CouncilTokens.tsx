import { ErrorMessage } from '@hookform/error-message';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';

import { DAO_UNITS } from '@/config';
import useElioDao from '@/hooks/useElioDao';
import type {
  CouncilTokensValues,
  IssueTokensValues,
} from '@/stores/elioStore';
import useElioStore from '@/stores/elioStore';
import d from '@/svg/delete.svg';
import plus from '@/svg/plus.svg';
import { isStellarPublicKey, truncateMiddle, uiTokens } from '@/utils';
import BigNumber from 'bignumber.js';

// commented out the sections where we distribute tokens to the council and multisig creation.
const CouncilTokens = (props: { daoId: string | null }) => {
  const [
    isTxnProcessing,
    currentDao,
    currentWalletAccount,
    daoTokenBalance,
    fetchDaoTokenBalanceFromDB,
    updateDaoTokenBalance,
  ] = useElioStore((s) => [
    s.isTxnProcessing,
    s.currentDao,
    s.currentWalletAccount,
    s.daoTokenBalance,
    s.fetchDaoTokenBalanceFromDB,
    s.updateDaoTokenBalance,
  ]);
  const { transferDaoTokens } = useElioDao();

  const [membersCount, setMembersCount] = useState(2);
  const formMethods = useForm<CouncilTokensValues>({
    defaultValues: {
      creatorName: '',
      creatorWallet: currentWalletAccount?.publicKey,
      councilMembers: [
        {
          name: '',
          walletAddress: '',
        },
      ],
      councilThreshold: 2,
      tokenRecipients: [
        {
          walletAddress: '',
          tokens: new BigNumber(0),
        },
      ],
      treasuryTokens: new BigNumber(0),
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = formMethods;

  const tokensValues = useWatch({
    control,
    name: 'tokenRecipients',
  });

  const getTotalRecipientsTokens = (
    recipients: CouncilTokensValues['tokenRecipients']
  ) => {
    let total = BigNumber(0);
    if (!recipients) {
      return BigNumber(0);
    }
    // eslint-disable-next-line
    for (const item of recipients) {
      total = total.plus(item.tokens);
    }
    // multiply by DAO units to get the right tokens
    return total;
  };

  const remain = daoTokenBalance
    ? daoTokenBalance.minus(getTotalRecipientsTokens(tokensValues))
    : BigNumber(0);

  const {
    fields: councilMembersFields,
    append: councilMembersAppend,
    remove: councilMembersRemove,
  } = useFieldArray({
    control,
    name: 'councilMembers',
  });

  const {
    fields: tokenRecipientsFields,
    append: tokenRecipientsAppend,
    remove: tokenRecipientsRemove,
  } = useFieldArray({
    control,
    name: 'tokenRecipients',
  });

  const onSubmit = async (data: IssueTokensValues) => {
    if (!props.daoId) {
      return;
    }
    const toPublicKeys = data.tokenRecipients.map((item) => {
      return item.walletAddress;
    });
    const amounts = data.tokenRecipients.map((item) => {
      return item.tokens;
    });
    await transferDaoTokens(props.daoId, toPublicKeys, amounts);
  };

  useEffect(() => {
    setValue('treasuryTokens', remain);
  });

  const handleAddMember = () => {
    const newCount = membersCount + 1;
    setMembersCount(newCount);
    councilMembersAppend({
      name: '',
      walletAddress: '',
    });
  };

  const handleAddRecipient = () => {
    tokenRecipientsAppend({
      walletAddress: '',
      tokens: BigNumber(0),
    });
  };

  const recipientsFields = () => {
    if (!daoTokenBalance) {
      return <div className='text-center'>Please issue tokens first</div>;
    }
    return tokenRecipientsFields.map((item, index) => {
      return (
        <div className='flex' key={item.id} data-k={item.id}>
          <div className='flex'>
            <div className='w-[370px] flex-col'>
              <p className='pl-8'>Wallet Address</p>
              <div className='flex'>
                <div className='mr-4 flex flex-col justify-center'>
                  {index + 1}
                </div>
                <input
                  type='text'
                  placeholder='Wallet Address'
                  className='input-primary input text-xs'
                  {...register(`tokenRecipients.${index}.walletAddress`, {
                    required: 'Required',
                    validate: {
                      isValidAddress: (v) => {
                        if (isStellarPublicKey(v)) {
                          return true;
                        }
                        return 'Not a valid address';
                      },
                    },
                  })}
                />
              </div>
              <ErrorMessage
                errors={errors}
                name={`tokenRecipients.${index}.walletAddress`}
                render={({ message }) => (
                  <p className='mt-1 pl-8 text-error'>{message}</p>
                )}
              />
            </div>
            <div className='mx-3 flex flex-col'>
              <p className='ml-1'>Number of Tokens</p>
              <input
                type='number'
                className='input-primary input text-center'
                {...register(`tokenRecipients.${index}.tokens`, {
                  required: 'Required',
                  min: { value: 1, message: 'Minimum is 1' },
                  setValueAs: (tokens) => {
                    const bnTokens = BigNumber(tokens);
                    return bnTokens.multipliedBy(BigNumber(DAO_UNITS));
                  },
                })}
              />
              <ErrorMessage
                errors={errors}
                name={`tokenRecipients.${index}.tokens`}
                render={({ message }) => (
                  <p className='ml-2 mt-1 text-error'>{message}</p>
                )}
              />
            </div>
            <div className='flex w-[65px] items-center justify-center pt-5'>
              {/* {watch(`tokenRecipients.${index}.tokens`)
                .div(daoTokenBalance)
                .mul(new BN(100))
                .gte(new BN(100))
                ? 'NaN'
                : watch(`tokenRecipients.${index}.tokens`)
                    ?.div(daoTokenBalance)
                    .mul(new BN(100))
                    .toString()}{' '}
              % */}
            </div>
          </div>
          <div className='ml-3 flex items-center pt-5'>
            <Image
              className='duration-150 hover:cursor-pointer hover:brightness-125 active:brightness-90'
              src={d}
              width={18}
              height={18}
              alt='delete button'
              onClick={() => {
                tokenRecipientsRemove(index);
              }}
            />
          </div>
        </div>
      );
    });
  };

  const membersFields = () => {
    return councilMembersFields.map((item, index) => {
      return (
        <div className='flex px-4' key={item.id} data-k={item.id}>
          <div className='flex'>
            <div className='mr-3 flex flex-col'>
              <p className='pl-8'>Name</p>
              <div className='flex '>
                <div className='mr-4 flex flex-col justify-center'>
                  {index + 2}
                </div>
                <input
                  type='text'
                  placeholder='Name'
                  className='input-primary input '
                  {...register(`councilMembers.${index}.name`, {
                    required: 'Required',
                    minLength: { value: 1, message: 'Minimum is 1' },
                    maxLength: { value: 30, message: 'Maximum is 30' },
                  })}
                />
              </div>
              <ErrorMessage
                errors={errors}
                name={`councilMembers.${index}.name`}
                render={({ message }) => (
                  <p className='mt-1 pl-8 text-error'>{message}</p>
                )}
              />
            </div>
            <div className='w-[370px] flex-col'>
              <p className='ml-1'>Wallet Address</p>
              <input
                type='text'
                placeholder='Wallet Address'
                className='input-primary input text-xs'
                {...register(`councilMembers.${index}.walletAddress`, {
                  required: 'Required',
                  // fixme add validation
                })}
              />
              <ErrorMessage
                errors={errors}
                name={`councilMembers.${index}.walletAddress`}
                render={({ message }) => (
                  <p className='ml-2 mt-1 text-error'>{message}</p>
                )}
              />
            </div>
            <div className='ml-3 flex items-center pt-5'>
              <Image
                className='duration-150 hover:cursor-pointer hover:brightness-125 active:brightness-90'
                src={d}
                width={18}
                height={18}
                alt='delete button'
                onClick={() => {
                  const newCount = membersCount - 1;
                  setMembersCount(newCount);
                  councilMembersRemove(index);
                }}
              />
            </div>
          </div>
        </div>
      );
    });
  };

  useEffect(() => {
    if (currentDao?.daoId && currentWalletAccount) {
      console.log('fetch balance');
      fetchDaoTokenBalanceFromDB(
        currentDao?.daoId,
        currentWalletAccount?.publicKey
      );
    } else {
      updateDaoTokenBalance(new BigNumber(0));
    }
  }, [currentDao, currentWalletAccount, fetchDaoTokenBalanceFromDB]);

  return (
    <div className='flex flex-col items-center gap-y-5'>
      <div>
        <progress
          className='progress progress-success h-[10px] w-[400px]'
          value='75'
          max='100'
        />
      </div>
      <div>
        <h3 className='text-center text-primary'>{currentDao?.daoName}</h3>
        <h2 className='text-center text-primary'>Distribute DAO Tokens</h2>
      </div>
      <div className='px-24'>
        <p className='text-center'>
          DAOs issue tokens to incentivize community participation and provide a
          means of decentralized governance and decision-making.
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className='w-full'>
        <div className='card mb-6 flex w-full flex-col items-center gap-y-5 border-none py-5 hover:brightness-100'>
          <div>
            <h4 className='text-center'>Add Council Members</h4>
            <p className='px-24 text-sm'>
              Council members wallets will be used to create a multi-signature
              account
            </p>
          </div>
          <div className='flex px-4'>
            <div className='mr-3 flex flex-col'>
              <p className='pl-8'>Your Name</p>
              <div className='flex'>
                <div className='mr-4 flex flex-col justify-center'>1</div>
                <input
                  type='text'
                  placeholder='Your name'
                  className='input-primary input'
                  {...register('creatorName', {
                    required: 'Required',
                    minLength: { value: 1, message: 'Minimum is 1' },
                    maxLength: { value: 30, message: 'Maximum is 30' },
                  })}
                />
              </div>
              <ErrorMessage
                errors={errors}
                name='creatorName'
                render={({ message }) => (
                  <p className='mt-1 pl-8 text-error'>{message}</p>
                )}
              />
            </div>
            <div className='flex-col'>
              <p className='ml-1 opacity-40'>Wallet Address</p>
              <input type='text' hidden {...register('creatorWallet')} />
              <div className='flex h-12 w-[400px] items-center rounded-[10px] border-[0.3px] bg-base-50 px-2 opacity-40'>
                {truncateMiddle(currentWalletAccount?.publicKey!!)}
              </div>
            </div>
          </div>
          {membersFields()}
          <div className='mb-4'>
            <button
              className='btn border-white bg-[#403945] text-white hover:bg-[#403945] hover:brightness-110'
              type='button'
              onClick={handleAddMember}>
              <Image
                src={plus}
                width={17}
                height={17}
                alt='add one'
                className='mr-2'
              />
              Add a Member
            </button>
          </div>
          <div>
            <h4 className='text-center'>Enter Council Approval Threshold</h4>
            <p className='px-24 text-center text-sm'>
              The approval threshold is a defined level of consensus that must
              be reached in order for proposals to be approved and implemented
            </p>
          </div>
          <div className='w-[100px]'>
            <input
              className='input-primary input text-center'
              type='number'
              placeholder='1'
              {...register('councilThreshold', {
                required: 'Required',
                min: { value: 1, message: 'Minimum is 1' },
                max: {
                  value: membersCount,
                  message: 'Cannot exceed # of council members',
                },
              })}
            />
            <ErrorMessage
              errors={errors}
              name='councilThreshold'
              render={({ message }) => (
                <p className='ml-2 mt-1 text-error'>{message}</p>
              )}
            />
          </div>
          <p className='text-lg'>
            Out of <span className='text-primary'>{membersCount}</span> Council
            Member(s)
          </p>
        </div>
        <div className='card mb-5 flex w-full items-center justify-center gap-y-6 border-none py-5 hover:brightness-100'>
          <div className='flex flex-col gap-y-4'>
            <div className='w-full text-center'>
              <h4 className='text-center'>Recipients</h4>
              <p className='text-sm'>
                Distribute Tokens To Other Wallet Addresses
              </p>
            </div>
            {recipientsFields()}
          </div>
          <div>
            {daoTokenBalance ? (
              <button
                className='btn border-white bg-[#403945] text-white hover:bg-[#403945] hover:brightness-110'
                type='button'
                onClick={handleAddRecipient}>
                <Image
                  src={plus}
                  width={17}
                  height={17}
                  alt='add one'
                  className='mr-2'
                />
                Add a Recipient
              </button>
            ) : null}
          </div>
          <div>
            <div className='w-full text-center'>
              <h4 className='mb-2 text-center'>Treasury</h4>
            </div>
            <div className='flex flex-col justify-center px-10 text-center'>
              <p>Distribute</p>
              <p>
                <span className='mx-3 w-[70px] text-center text-primary'>
                  {uiTokens(remain, 'dao', currentDao?.daoId)}
                  {' Tokens'}
                </span>
              </p>
              <p>
                {' '}
                {currentDao?.daoId} tokens to treasury controlled by council
                members
              </p>
            </div>
          </div>
        </div>
        <div className='mt-6 flex w-full justify-end'>
          <button
            className={`btn-primary btn mr-3 w-48 ${
              !daoTokenBalance ? 'btn-disabled' : ''
            } ${isTxnProcessing ? 'loading' : ''}`}
            type='submit'>
            {`${isTxnProcessing ? 'Processing' : 'Approve and Sign'}`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CouncilTokens;
