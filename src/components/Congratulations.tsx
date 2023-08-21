import Image from 'next/image';
import { useRouter } from 'next/router';

import useElioStore from '@/stores/elioStore';
import congratsImage from '@/svg/congrats.svg';
import { useEffect } from 'react';

const Congratulations = (props: { daoId: string; daoName: string }) => {
  const router = useRouter();
  const [updateShowCongrats, currentDao] = useElioStore((s) => [
    s.updateShowCongrats,
    s.currentDao,
  ]);

  const handleDashboard = () => {
    router.push(`/dao/${props.daoId}`);
    updateShowCongrats(false);
  };

  useEffect(() => {
    setTimeout(() => {
      router.push(`/dao/${props.daoId}`);
      updateShowCongrats(false);
    }, 3000);
  });

  return (
    <div className='flex flex-col items-center'>
      <div>
        <progress
          className='progress progress-success h-[10px] w-[400px]'
          value='100'
          max='100'
        />
      </div>
      <div>
        <Image src={congratsImage} width={270} height={270} alt='congrats' />
      </div>
      <div className='mb-5 text-center'>
        <h2 className='font-semibold text-primary'>Congratulations!</h2>
        <p>
          <span className='text-lg font-bold'>{currentDao?.daoName}</span> has
          been successfully set up!
        </p>
      </div>
      <div>
        <button className='btn-primary btn' onClick={handleDashboard}>
          Return to DAO dashboard
        </button>
      </div>
    </div>
  );
};

export default Congratulations;
