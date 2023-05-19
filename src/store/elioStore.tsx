import { create } from 'zustand';

export interface DaoDetail {
  daoId: string;
  daoName: string;
  daoOwnerAddress: string;
  daoCreatorAddress: string;
  setupComplete: boolean;
  daoAssetId: number | null;
  metadataUrl: string | null;
  metadataHash: string | null;
  descriptionShort: string | null;
  descriptionLong: string | null;
  email: string | null;
  images: {
    contentType: string | null;
    small: string | null;
    medium: string | null;
    large: string | null;
  };
}

export declare enum WalletNetwork {
  PUBLIC = 'Public Global Stellar Network ; September 2015',
  FUTURENET = 'Test SDF Future Network ; October 2022',
  TESTNET = 'Test SDF Network ; September 2015',
}

export interface WalletAccount {
  publicKey: string;
  network: WalletNetwork;
}

export interface ElioState {
  currentDao: DaoDetail | null;
  currentWalletAccount: WalletAccount | null;
  isConnectModalOpen: boolean;
  walletConnected: boolean;
  txnProcessing: boolean;
}

export interface ElioActions {
  updateCurrentDao: (dao: DaoDetail | null) => void;
  updateCurrentWalletAccount: (walletAccount: WalletAccount | null) => void;
  updateIsConnectModalOpen: (isOpen: boolean) => void;
  updateWalletConnected: (connected: boolean) => void;
  updateTxnProcessing: (txnProcessing: boolean) => void;
}

export interface ElioStore extends ElioState, ElioActions {}

const useElioStore = create<ElioStore>()((set, get) => ({
  currentDao: null,
  currentWalletAccount: null,
  isConnectModalOpen: false,
  walletConnected: false,
  txnProcessing: false,

  updateCurrentDao: (currentDao) => set({ currentDao }),
  updateCurrentWalletAccount: (currentWalletAccount) =>
    set({ currentWalletAccount }),
  updateIsConnectModalOpen: (isConnectModalOpen) => set({ isConnectModalOpen }),
  updateWalletConnected: (walletConnected) => set({ walletConnected }),
  updateTxnProcessing: (txnProcessing) => set({ txnProcessing }),
}));

export default useElioStore;
