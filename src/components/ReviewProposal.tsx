import ReactHtmlParser from 'react-html-parser';

import useElioDao from '@/hooks/useElioDao';
import useElioStore from '@/stores/elioStore';
import { useEffect } from 'react';

const ReviewProposal = (props: {
  daoId: string;
  handleChangePage: Function;
}) => {
  const [
    elioStats,
    isTxnProcessing,
    updateIsTxnProcessing,
    proposalCreationValues,
    fetchElioStats,
    handleErrors,
  ] = useElioStore((s) => [
    s.elioStats,
    s.isTxnProcessing,
    s.updateIsTxnProcessing,
    s.proposalCreationValues,
    s.fetchElioStats,
    s.handleErrors,
  ]);
  const { createProposal, postProposalMetadata, setProposalMetadataOnChain } =
    useElioDao();

  useEffect(() => {
    fetchElioStats();
  }, [fetchElioStats]);

  const submitProposal = async () => {
    updateIsTxnProcessing(true);
    if (proposalCreationValues) {
      // WIP here

      await createProposal(props.daoId, () => {
        if (!elioStats) {
          handleErrors('Cannot get proposal ID');
          return;
        }
        setTimeout(async () => {
          const proposalId = elioStats.proposalCount;
          const metadata = await postProposalMetadata(
            proposalId,
            proposalCreationValues
          );
          if (!metadata) {
            return;
          }
          await setProposalMetadataOnChain(
            props.daoId,
            proposalId,
            metadata.metadataUrl,
            metadata.metadataHash
          );
        }, 5000);
      });
    }
  };

  return (
    <div className='flex flex-col gap-y-6 px-6'>
      <div className='flex justify-center'>
        <progress
          className='progress progress-success h-[10px] w-[400px]'
          value='80'
          max='100'
        />
      </div>
      <div className='text-center'>
        <h2 className='text-primary'>Review Proposal</h2>
        <p className=''>
          {`NOTE: Submitting a proposal at this step requires you to sign and approve 3 times.`}
        </p>
      </div>
      <div className='bg-base-card flex flex-col gap-y-4 rounded-xl px-4 py-8'>
        <div className='flex flex-col'>
          <p className='text-neutral-focus'>Proposal Name</p>
          <p>{proposalCreationValues?.title}</p>
        </div>
        <div className='flex flex-col'>
          <div className='text-neutral-focus'>Description</div>
          <div className='description-display'>
            {ReactHtmlParser(proposalCreationValues?.description || '')}
          </div>
        </div>
        <div className='flex flex-col'>
          <p className='text-neutral-focus'>Discussion Link</p>
          <div className='description-display'>
            {proposalCreationValues?.url}
          </div>
        </div>
      </div>
      <div className='flex justify-end'>
        <button
          className={`btn mr-4 w-48 ${isTxnProcessing ? 'loading' : ''}`}
          onClick={() => {
            props.handleChangePage('');
          }}>
          Back
        </button>
        <button
          className={`btn-primary btn mr-4 w-48 ${
            isTxnProcessing ? 'loading' : ''
          }`}
          onClick={submitProposal}>{`${
          isTxnProcessing ? 'Processing' : 'Submit'
        }`}</button>
      </div>
    </div>
  );
  // fix me: need to add majority vote
};

export default ReviewProposal;
