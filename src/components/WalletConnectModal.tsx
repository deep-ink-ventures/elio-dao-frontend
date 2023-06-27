import useElioStore from '@/stores/elioStore';
import freight from '@/svg/freight.svg';
import rightArrow from '@/svg/rightArrow.svg';
import Modal from 'antd/lib/modal';
import Image from 'next/image';

const WalletConnectModal = () => {
  const [updateIsConnectModalOpen, isConnectModalOpen, getWallet] =
    useElioStore((s) => [
      s.updateIsConnectModalOpen,
      s.isConnectModalOpen,
      s.getWallet,
    ]);

  const handleWalletSelect = async (e: any) => {
    getWallet();
    updateIsConnectModalOpen(false);
  };

  return (
    <Modal
      open={isConnectModalOpen}
      confirmLoading={false}
      wrapClassName='a-modal-bg'
      className='wallet-modal'
      onCancel={() => {
        updateIsConnectModalOpen(false);
      }}
      footer={null}
      width={615}
      zIndex={99}>
      <div className='flex flex-col items-center justify-center text-center'>
        <div>
          <h2>Select a wallet to connect</h2>
        </div>
        <div className='my-4 flex h-[300px] w-full flex-col items-center justify-center'>
          <button
            className='btn h-16 w-[75%]'
            name={'Freighter'}
            onClick={(e) => handleWalletSelect(e)}>
            <div className='flex w-full items-center justify-between'>
              <Image src={freight} height={35} width={35} alt='freight' />
              <div>{'Freighter'}</div>
              <Image src={rightArrow} height={8} width={15} alt='right arrow' />
            </div>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default WalletConnectModal;
