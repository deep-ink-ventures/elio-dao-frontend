import 'react-quill/dist/quill.snow.css';

import { ErrorMessage } from '@hookform/error-message';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { PROPOSAL_CREATION_DEPOSIT_XLM } from '@/config';
import type { DaoDetail } from '@/stores/elioStore';
import useElioStore from '@/stores/elioStore';
import Spinner from './Spinner';

const Quill = dynamic(
  import('react-quill').then((mod) => mod),
  {
    ssr: false,
    loading: () => <Spinner />,
  }
);

interface ProposalValues {
  proposalName: string;
  proposalDescription: string;
  discussionLink: string;
}

const CreateProposal = (props: {
  dao: DaoDetail | null;
  handleChangePage: Function;
}) => {
  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'blockquote'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
      ['clean'],
    ],
  };

  const formats = [
    'bold',
    'italic',
    'underline',
    'blockquote',
    'list',
    'bullet',
    'link',
  ];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<ProposalValues>();

  const [
    currentWalletAccount,
    proposalCreationValues,
    updateProposalCreationValues,
  ] = useElioStore((s) => [
    s.currentWalletAccount,
    s.proposalCreationValues,
    s.updateProposalCreationValues,
  ]);

  const hasEnoughTokens = !!currentWalletAccount?.nativeTokenBalance.gt(
    PROPOSAL_CREATION_DEPOSIT_XLM
  );

  const onSubmit = (data: ProposalValues) => {
    updateProposalCreationValues({
      title: data.proposalName,
      description: data.proposalDescription,
      url: data.discussionLink,
    });
    props.handleChangePage('review');
  };

  useEffect(() => {
    if (proposalCreationValues) {
      setValue('proposalName', proposalCreationValues.title);
      setValue('proposalDescription', proposalCreationValues.description);

      setValue('discussionLink', proposalCreationValues.url);
    }
  }, [proposalCreationValues, setValue]);

  const watchName = watch('proposalName', '');
  const watchLink = watch('discussionLink', '');

  const alert = () => {
    if (hasEnoughTokens) {
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
              <span className='font-bold'>{`100 XLM`}</span>
              {`will be reserved upon creation of a proposal. The reserved tokens
              will be refunded when the proposal is finalized .`}
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
            Sorry you need at least{' '}
            <span className='font-bold'>{`100 XLM`}</span> to create a Proposal
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className='flex flex-col items-center gap-y-6 px-12 py-4'>
      <div className='w-full md:w-[unset]'>
        <progress
          className='progress progress-success h-[10px] w-full md:w-[400px]'
          value='40'
          max='100'
        />
      </div>
      <div className='text-center'>
        <h2 className='text-primary'>New Proposal For {props.dao?.daoName}</h2>
        <p className='px-4 md:px-16'>
          {` Creating a proposal is your chance to share your vision, ideas, and expertise. Whether it's a project proposal, a policy change, or a community initiative, your proposal can make a difference and help shape the future of the organization.`}
        </p>
      </div>
      {alert()}
      <div
        className={`flex w-full items-center ${
          !hasEnoughTokens ? 'text-neutral/30' : null
        }`}>
        <form onSubmit={handleSubmit(onSubmit)} className='min-w-full'>
          <div className='mb-8 flex flex-col items-center gap-y-8'>
            <div className='min-w-full'>
              <div className='flex items-end justify-between'>
                <p className='mb-1 ml-2'>
                  Proposal Name{' '}
                  <span className='text-lg font-medium text-red-600'>*</span>
                </p>
              </div>
              <div className='relative'>
                <input
                  className={`input ${
                    watchName.length > 64 || errors.proposalName
                      ? 'input-error'
                      : 'input-primary'
                  }`}
                  type='text'
                  placeholder={'e.g. Deploy Uniswap V3 on Avalanche'}
                  disabled={!hasEnoughTokens}
                  {...register('proposalName', {
                    required: 'Required',
                    maxLength: { value: 128, message: 'Max length is 128' },
                    minLength: { value: 5, message: 'Minimum length is 5' },
                  })}
                />
                <ErrorMessage
                  errors={errors}
                  name='proposalName'
                  render={({ message }) => (
                    <p className='ml-2 mt-1 text-error'>{message}</p>
                  )}
                />
                <p
                  className={`absolute right-2 top-3 opacity-60 ${
                    watchName.length > 128 ? 'text-error' : null
                  }`}>
                  {watchName.length}/128
                </p>
              </div>
            </div>
            <div className='mb-10 min-w-full'>
              <p className='mb-1 ml-2'>
                Proposal Description (2000 characters or less)
              </p>
              <div>
                {!hasEnoughTokens ? (
                  <input className='textarea h-48' disabled></input>
                ) : (
                  <Controller
                    control={control}
                    name='proposalDescription'
                    rules={{
                      required: 'Required',
                      maxLength: { value: 2000, message: 'Max length is 2000' },
                    }}
                    render={({ field: { onChange, value } }) => (
                      <Quill
                        theme='snow'
                        onChange={(description) => onChange(description)}
                        value={value || ''}
                        modules={modules}
                        formats={formats}
                      />
                    )}
                  />
                )}
              </div>
              {errors.proposalDescription && (
                <p className='ml-2 mt-12 text-error'>
                  {errors.proposalDescription.message}
                </p>
              )}
            </div>
            <div className='min-w-full'>
              <div className='flex items-end justify-between'>
                <p className='mb-1 ml-2'>
                  Discussion Link{' '}
                  <span className='text-lg font-medium text-red-600'>*</span>
                </p>
                <p className='mb-1 ml-2 text-sm'>
                  Add a discussion or forum link
                </p>
              </div>
              <input
                className={`input ${
                  watchLink.length > 250 || errors.discussionLink
                    ? 'input-error'
                    : 'input-primary'
                }`}
                type='text'
                placeholder='https://'
                disabled={!hasEnoughTokens}
                {...register('discussionLink', {
                  required: 'Required',
                  maxLength: { value: 250, message: 'Max Length is 250' },
                  minLength: { value: 8, message: 'Minimum length is 8' },
                  pattern: {
                    value:
                      // eslint-disable-next-line
                      /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/,
                    message: `This does not look like a valid URL. Contact us if this is a mistake.`,
                  },
                })}
              />
              <ErrorMessage
                errors={errors}
                name='discussionLink'
                render={({ message }) => (
                  <p className='ml-2 mt-1 text-error'>{message}</p>
                )}
              />
            </div>
          </div>
          <div className='flex justify-center'>
            <button
              className={`btn-primary btn w-full md:w-96`}
              type='submit'
              disabled={!hasEnoughTokens}>
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProposal;
