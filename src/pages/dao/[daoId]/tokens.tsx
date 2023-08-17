import { useRouter } from 'next/router';

import TransferForm from '@/components/TransferForm';
import useElioStore from '@/stores/elioStore';
import MainLayout from '@/templates/MainLayout';

const Tokens = () => {
  const router = useRouter();
  const { daoId } = router.query;
  const [currentDao] = useElioStore((s) => [s.currentDao]);
  if (!currentDao) {
    <MainLayout title='Tokens page for DAOS' description='Tokens page for DAOS'>
      <div>something is wrong</div>
    </MainLayout>;
  }

  if (!currentDao?.daoAssetAddress) {
    return (
      <MainLayout
        title='Tokens page for DAOS'
        description='Tokens page for DAOS'>
        <div className='mt-2 flex justify-center'>
          <h2>Please Issues Tokens first</h2>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title='Tokens page for DAOS' description='Tokens page for DAOS'>
      <div className='hero mt-5'>
        <div className='hero-content rounded-xl bg-slate-800 text-center'>
          <div className='max-w-md'>
            <h1 className='text-3xl font-bold'>{`Transfer ${daoId} tokens`}</h1>
            <TransferForm
              assetAddress={currentDao.daoAssetAddress as string}
              daoId={daoId as string}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Tokens;
