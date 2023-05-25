import type { StellarWalletsKit } from 'stellar-wallets-kit';
import { create } from 'zustand';

export type DaoPage = 'dashboard' | 'proposals';

export interface CreateDaoData {
  daoId: string;
  daoName: string;
}

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

export declare enum WalletType {
  XBULL = 'XBULL',
  FREIGHTER = 'FREIGHTER',
  ALBEDO = 'ALBEDO',
  RABET = 'RABET',
  WALLET_CONNECT = 'WALLET_CONNECT',
}

export interface WalletAccount {
  publicKey: string;
  network: WalletNetwork;
  kit: StellarWalletsKit;
}

export interface ElioState {
  currentDao: DaoDetail | null;
  currentWalletAccount: WalletAccount | null;
  isConnectModalOpen: boolean;
  isWalletConnected: boolean;
  txnProcessing: boolean;
  daoPage: DaoPage;
  isStartModalOpen: boolean;
}

export interface ElioActions {
  updateCurrentDao: (dao: DaoDetail | null) => void;
  updateCurrentWalletAccount: (walletAccount: WalletAccount | null) => void;
  updateIsConnectModalOpen: (isOpen: boolean) => void;
  updateWalletConnected: (connected: boolean) => void;
  updateTxnProcessing: (txnProcessing: boolean) => void;
  updateDaoPage: (daoPage: DaoPage) => void;
  updateIsStartModalOpen: (isStartModalOpen: boolean) => void;
}

export interface ElioStore extends ElioState, ElioActions {}

const useElioStore = create<ElioStore>()((set, get) => ({
  currentDao: null,
  currentWalletAccount: null,
  isConnectModalOpen: false,
  isWalletConnected: false,
  txnProcessing: false,
  daoPage: 'dashboard',
  isStartModalOpen: false,
  updateCurrentDao: (currentDao) => set({ currentDao }),
  updateCurrentWalletAccount: (currentWalletAccount) =>
    set({ currentWalletAccount }),
  updateIsConnectModalOpen: (isConnectModalOpen) => set({ isConnectModalOpen }),
  updateWalletConnected: (isWalletConnected) => set({ isWalletConnected }),
  updateTxnProcessing: (txnProcessing) => set({ txnProcessing }),
  updateDaoPage: (daoPage) => set(() => ({ daoPage })),
  updateIsStartModalOpen: (isStartModalOpen) =>
    set(() => ({ isStartModalOpen })),
}));

export default useElioStore;
