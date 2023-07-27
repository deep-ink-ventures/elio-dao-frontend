import DaoCard from '@/components/DaoCard';
import Spinner from '@/components/Spinner';

import type { DaoDetail } from '../stores/elioStore';

const DaoCards = ({ daos }: { daos: DaoDetail[] | null }) => {
  return daos && daos?.length > 0 ? (
    <>
      <div className='mx-auto flex flex-wrap justify-center md:px-2'>
        {daos.map((dao) => {
          return (
            <DaoCard
              key={dao.daoId}
              daoId={dao.daoId}
              daoName={dao.daoName}
              daoAssetId={dao.daoAssetId}
              daoOwnerAddress={dao.daoOwnerAddress}
              imageUrl={dao.images.small}
              setupComplete={dao.setupComplete}
            />
          );
        })}
      </div>
    </>
  ) : (
    <div>
      <Spinner />
    </div>
  );
};

export default DaoCards;
