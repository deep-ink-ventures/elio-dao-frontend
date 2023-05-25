import Modal from 'antd/lib/modal';
import Image from 'next/image';
import {
  StellarWalletsKit,
  WalletNetwork,
  WalletType,
} from 'stellar-wallets-kit';

import useElioStore from '@/stores/elioStore';
import freight from '@/svg/freight.svg';
import rightArrow from '@/svg/rightArrow.svg';

const WalletConnectModal = () => {
  const [
    updateIsConnectModalOpen,
    isConnectModalOpen,
    updateCurrentWalletAccount,
    updateWalletConnected,
  ] = useElioStore((s) => [
    s.updateIsConnectModalOpen,
    s.isConnectModalOpen,
    s.updateCurrentWalletAccount,
    s.updateWalletConnected,
  ]);

  const handleWalletSelect = (e: any) => {
    const walletName = e.currentTarget.name;
    if (walletName === WalletType.FREIGHTER) {
      const kit = new StellarWalletsKit({
        network: WalletNetwork.FUTURENET,
        selectedWallet: WalletType.FREIGHTER,
      });
      kit.getPublicKey().then((key) => {
        updateCurrentWalletAccount({
          publicKey: key,
          network: WalletNetwork.FUTURENET,
          kit,
        });
      });
    }
    updateIsConnectModalOpen(false);
    updateWalletConnected(true);
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
            name={WalletType.FREIGHTER}
            onClick={(e) => handleWalletSelect(e)}>
            <div className='flex w-full items-center justify-between'>
              <Image src={freight} height={35} width={35} alt='freight' />
              <div>{WalletType.FREIGHTER}</div>
              <Image src={rightArrow} height={8} width={15} alt='right arrow' />
            </div>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default WalletConnectModal;
