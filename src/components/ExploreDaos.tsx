import Image from 'next/image';
import { useEffect, useState } from 'react';

import DaoCards from '@/components/DaoCards';
import Spinner from '@/components/Spinner';
import useElioStore from '@/stores/elioStore';
import telescope from '@/svg/telescope.svg';

const ExploreDaos = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [fetchDaosDB, daos] = useElioStore((s) => [s.fetchDaosDB, s.daos]);
  const filteredDaos = daos?.filter((dao) => {
    return (
      dao.daoName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dao.daoId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDaosDB();
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, []);

  const handleSearch = (e: any) => {
    setSearchTerm(e.target.value);
  };

  const displayDaos = () => {
    if (!filteredDaos || filteredDaos?.length === 0) {
      return <div className='mt-5'>Sorry no DAOs found</div>;
    }
    return <DaoCards daos={filteredDaos} />;
  };

  return (
    <div className='container mb-20 flex min-h-[600px] flex-col px-6 py-5'>
      <div className='mb-5 flex h-16 flex-col items-center justify-center px-2 md:mb-0 md:flex-row md:justify-between'>
        <div className='my-3 flex items-center md:mb-0'>
          <div className='mr-2'>
            <Image src={telescope} width={27} height={28} alt='building' />
          </div>
          <h3 className='flex items-center'>Explore</h3>
        </div>
        <div className='flex items-center'>
          <input
            id='search-input'
            className='input-primary input w-72 text-sm'
            placeholder='Search DAO name or DAO ID'
            onChange={handleSearch}
          />
        </div>
      </div>
      <div className='my-2 flex justify-center'>
        {!filteredDaos ? <Spinner /> : displayDaos()}
      </div>
    </div>
  );
};

export default ExploreDaos;
