import type BN from 'bn.js';
import type { StellarWalletsKit } from 'stellar-wallets-kit';
import { create } from 'zustand';

import { daoArray } from './fakeData';

export interface TransferFormValues {
  assetId: number;
  toAddress: string;
  amount: BN;
}

export interface TokenRecipient {
  walletAddress: string;
  tokens: BN; // this is before adding DAO units
}

export interface CouncilMember {
  name: string;
  walletAddress: string;
}

export interface CouncilTokensValues
  extends CouncilFormValues,
    IssueTokensValues {
  isFinished: false;
}

export interface LogoFormValues {
  email: string;
  shortOverview: string;
  longDescription: string;
  logoImage: FileList;
  imageString: string;
}

export interface MajorityModelValues {
  tokensToIssue: BN; // fixme BN
  proposalTokensCost: number;
  minimumMajority: number; // percentage or decimals
  votingDays: number; // in days
}

export interface CouncilFormValues {
  creatorName: string;
  creatorWallet: string;
  councilMembers: CouncilMember[];
  councilThreshold: number; // number of councils needed to approve
}

export interface IssueTokensValues {
  tokenRecipients: TokenRecipient[];
  treasuryTokens: BN;
}

export enum TxnResponse {
  Success = 'SUCCESS',
  Error = 'ERROR',
  Warning = 'WARNING',
  Cancelled = 'CANCELLED',
}

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
  daos: DaoDetail[] | null;
  currentWalletAccount: WalletAccount | null;
  isConnectModalOpen: boolean;
  isWalletConnected: boolean;
  isTxnProcessing: boolean;
  daoPage: DaoPage;
  isStartModalOpen: boolean;
  createDaoSteps: number;
}

export interface ElioActions {
  updateCurrentDao: (dao: DaoDetail | null) => void;
  updateCurrentWalletAccount: (walletAccount: WalletAccount | null) => void;
  updateIsConnectModalOpen: (isOpen: boolean) => void;
  updateWalletConnected: (connected: boolean) => void;
  updateTxnProcessing: (txnProcessing: boolean) => void;
  updateDaoPage: (daoPage: DaoPage) => void;
  updateIsStartModalOpen: (isStartModalOpen: boolean) => void;
  updateCreateDaoSteps: (createDaoSteps: number) => void;
}

export interface ElioStore extends ElioState, ElioActions {}

const useElioStore = create<ElioStore>()((set, get) => ({
  currentDao: null,
  currentWalletAccount: null,
  isConnectModalOpen: false,
  isWalletConnected: false,
  isTxnProcessing: false,
  daoPage: 'dashboard',
  isStartModalOpen: false,
  createDaoSteps: 1,
  daos: daoArray,
  updateCurrentDao: (currentDao) => set({ currentDao }),
  updateCurrentWalletAccount: (currentWalletAccount) =>
    set({ currentWalletAccount }),
  updateIsConnectModalOpen: (isConnectModalOpen) => set({ isConnectModalOpen }),
  updateWalletConnected: (isWalletConnected) => set({ isWalletConnected }),
  updateTxnProcessing: (isTxnProcessing) => set({ isTxnProcessing }),
  updateDaoPage: (daoPage) => set(() => ({ daoPage })),
  updateIsStartModalOpen: (isStartModalOpen) =>
    set(() => ({ isStartModalOpen })),
  handleErrors: (err: Error | string) => {
    let message: string;
    if (typeof err === 'object') {
      message = err.message;
    } else {
      message = err;
    }

    const newNoti = {
      title: TxnResponse.Error,
      message,
      type: TxnResponse.Error,
      timestamp: Date.now(),
    };

    console.log(newNoti);
    // eslint-disable-next-line
      console.error(err)
    set({ isTxnProcessing: false });
    // get().addTxnNotification(newNoti);
  },
  updateCreateDaoSteps: (createDaoSteps) => set({ createDaoSteps }),
}));

export default useElioStore;
