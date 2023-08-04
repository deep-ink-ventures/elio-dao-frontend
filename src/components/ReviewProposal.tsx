import ReactHtmlParser from 'react-html-parser';

import useElioDao from '@/hooks/useElioDao';
import useElioStore from '@/stores/elioStore';

const ReviewProposal = (props: {
  daoId: string;
  handleChangePage: Function;
}) => {
  const [isTxnProcessing, updateIsTxnProcessing, proposalCreationValues] =
    useElioStore((s) => [
      s.isTxnProcessing,
      s.updateIsTxnProcessing,
      s.proposalCreationValues,
    ]);
  const { createProposal, setProposalMetadata } = useElioDao();

  const submitProposal = async () => {
    updateIsTxnProcessing(true);
    if (proposalCreationValues) {
      createProposal(props.daoId).then(() => {
        setProposalMetadata(props.daoId, 5, proposalCreationValues);
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
