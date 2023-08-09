import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// import useGenesisStore from '@/stores/genesisStore';
import Spinner from '@/components/Spinner';
import { BLOCK_TIME } from '@/config';
import useElioStore from '@/stores/elioStore';
import plusBlack from '@/svg/plus-black.svg';
import ProposalCard from './ProposalCard';

const Proposals = (props: { daoId: string }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [
    currentProposals,
    currentBlockNumber,
    fetchBlockNumber,
    updateCurrentBlockNumber,
    fetchProposalsDB,
  ] = useElioStore((s) => [
    s.currentProposals,
    s.currentBlockNumber,
    s.fetchBlockNumber,
    s.updateCurrentBlockNumber,
    s.fetchProposalsDB,
  ]);

  const filteredProposals = currentProposals?.filter((prop) => {
    return (
      prop.proposalId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prop.proposalName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const displayProposal = () => {
    if (!filteredProposals || filteredProposals?.length === 0) {
      return <div>Sorry no proposals found</div>;
    }

    if (props.daoId !== filteredProposals[0]?.daoId) {
      return <Spinner />;
    }
    return (
      <div className='flex flex-col gap-y-4'>
        {filteredProposals.map((prop) => {
          return (
            <Link
              href={`/dao/${encodeURIComponent(
                prop.daoId
              )}/proposal/${encodeURIComponent(prop.proposalId)}`}
              key={prop.proposalId}>
              <ProposalCard p={prop} />
            </Link>
          );
        })}
      </div>
    );
  };

  useEffect(() => {
    if (!props.daoId) {
      return;
    }

    const timer = setTimeout(() => {
      fetchProposalsDB(props.daoId);
      fetchBlockNumber();
    }, 500);
    // eslint-disable-next-line
    return () => clearTimeout(timer);
  }, [props.daoId]);

  const handleSearch = (e: any) => {
    setSearchTerm(e.target.value);
  };

  useEffect(() => {
    if (!currentBlockNumber) {
      return;
    }
    const timeout = setTimeout(() => {
      // fixme there's about 10s delay here
      updateCurrentBlockNumber(currentBlockNumber + 1);
    }, BLOCK_TIME * 1000);
    // eslint-disable-next-line
    return () => clearTimeout(timeout);
  }, [currentBlockNumber]);

  return (
    <div className='flex flex-col gap-y-4'>
      <div className='flex flex-col justify-between gap-4 sm:flex-row'>
        <div className='flex items-center'>
          <h1 className='text-2xl'>Proposals</h1>
        </div>
        <div className='flex flex-col gap-4 sm:flex-row'>
          <div className='order-2 sm:order-1'>
            <input
              id='search-input'
              className='input-primary input w-72 text-sm'
              placeholder='Search Proposals'
              onChange={handleSearch}
            />
          </div>
          {/* <div className='flex items-center justify-center'>
            <div className='flex h-12 min-w-[76px] items-center justify-center rounded-full border'>
              <p>All</p>
              <Image
                src={downArrow}
                height={15}
                width={12}
                alt='down-arrow'
                className='ml-2'
              />
            </div>
          </div> */}
          <div className='order-1 sm:order-2'>
            <Link
              href={`/dao/${encodeURIComponent(props.daoId)}/create-proposal`}>
              <button className='btn-primary btn flex items-center gap-x-1'>
                <Image src={plusBlack} height={16} width={16} alt='plus' />
                <p className='flex items-center pt-[1px]'>New Proposal</p>
              </button>
            </Link>
          </div>
        </div>
      </div>
      <div>
        {!currentProposals ? (
          <div className='mt-10'>
            <Spinner />
          </div>
        ) : (
          displayProposal()
        )}
      </div>
    </div>
  );
};

export default Proposals;
