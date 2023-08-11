import Image from 'next/image';
import Link from 'next/link';
import { useEffect,useState } from 'react';

// import useGenesisStore from '@/stores/genesisStore';
import Spinner from '@/components/Spinner';
import { BLOCK_TIME } from '@/config';
import { ProposalStatus } from '@/services/proposals';
import useElioStore from '@/stores/elioStore';
import plusBlack from '@/svg/plus-black.svg';
import cn from 'classnames';
import ProposalCard from './ProposalCard';

const ProposalFilterList = [
  {
    value: null,
    label: 'All',
  },
  ...Object.keys(ProposalStatus).map((status) => ({
    value: status,
    label: status,
  })),
];

const Proposals = (props: { daoId: string }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [
    currentProposals,
    currentBlockNumber,
    fetchBlockNumber,
    updateCurrentBlockNumber,
    fetchProposalsDB,
    isTxnProcessing,
  ] = useElioStore((s) => [
    s.currentProposals,
    s.currentBlockNumber,
    s.fetchBlockNumber,
    s.updateCurrentBlockNumber,
    s.fetchProposalsDB,
    s.isTxnProcessing,
  ]);

  const [filter, setFilter] = useState<ProposalStatus | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const filteredProposals = currentProposals?.filter((prop) => {
    return (
      (prop.proposalId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prop.proposalName?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (prop.status === filter || !filter)
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
  }, [props.daoId, isTxnProcessing]);

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

  const handleDropdownOpen = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleSetFilter = (newFilter?: ProposalStatus | null) => {
    setFilter(newFilter || null);
    setDropdownOpen(false);
  };

  return (
    <div className='flex flex-col gap-y-4'>
      <div className='flex flex-col justify-between gap-4 sm:flex-row'>
        <div className='flex items-center'>
          <h1 className='text-2xl'>Proposals</h1>
        </div>
        <div className='flex flex-col gap-4 sm:flex-row'>
          <div className='order-1 sm:order-1'>
            <input
              id='search-input'
              className='input-primary input w-72 text-sm'
              placeholder='Search Proposals'
              onChange={handleSearch}
            />
          </div>
          <div className='order-2 w-fit sm:order-1'>
            <div className='flex flex-col'>
              <button
                tabIndex={0}
                className={`btn bg-transparent px-6 py-3.5 hover:bg-base-100`}
                onClick={handleDropdownOpen}>
                <span className='flex items-center gap-2 capitalize text-neutral'>
                  {ProposalFilterList.find(
                    (assetFilter) => assetFilter.value === filter
                  )?.label?.toLowerCase()}{' '}
                  <span>
                    <svg
                      width='20'
                      height='16'
                      viewBox='0 0 20 20'
                      fill='none'
                      xmlns='http://www.w3.org/2000/svg'>
                      <path
                        d='M11.9802 16.9929C11.8484 16.9929 11.7099 16.9671 11.5648 16.9156C11.4198 16.864 11.2813 16.7739 11.1495 16.645L3.35604 9.03111C3.11868 8.79921 3 8.51579 3 8.18082C3 7.84586 3.11868 7.56244 3.35604 7.33054C3.59341 7.09865 3.87033 6.9827 4.18681 6.9827C4.5033 6.9827 4.78022 7.09865 5.01758 7.33054L11.9802 14.1328L18.9429 7.33054C19.1802 7.09865 19.4637 6.9827 19.7934 6.9827C20.1231 6.9827 20.4066 7.09865 20.644 7.33054C20.8813 7.56244 21 7.83942 21 8.1615C21 8.48358 20.8813 8.76057 20.644 8.99246L12.811 16.645C12.6791 16.7739 12.5473 16.864 12.4154 16.9156C12.2835 16.9671 12.1385 16.9929 11.9802 16.9929Z'
                        fill='#FAFAFA'
                      />
                    </svg>
                  </span>
                </span>
              </button>
              <div className='relative'>
                <div
                  className={cn(
                    'shadow-[0_0_4px_0_rgba(255, 255, 255, 0.20)] absolute right-0 top-[5px] z-10 w-fit space-y-2 rounded-2xl bg-secondary-content py-1 shadow-sm',
                    {
                      hidden: !dropdownOpen,
                    }
                  )}>
                  {ProposalFilterList.map((assetFilter) => (
                    <div
                      key={assetFilter.value}
                      onClick={() =>
                        handleSetFilter(assetFilter.value as ProposalStatus)
                      }
                      className={cn(
                        `group flex cursor-pointer items-center gap-2 whitespace-nowrap px-4 py-2 capitalize hover:text-primary`,
                        {
                          'text-primary': assetFilter.value === filter,
                        }
                      )}>
                      {assetFilter.label.toLowerCase()}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className='order-3 sm:order-3'>
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
