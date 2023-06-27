import {
  getNetworkDetails,
  getPublicKey,
  isConnected,
} from '@stellar/freighter-api';
import type BigNumber from 'bignumber.js';
import * as SorobanClient from 'soroban-client';
import { create } from 'zustand';
import { SOROBAN_RPC_ENDPOINT } from '../config/index';
import { daoArray } from './fakeData';

export interface FaultyReport {
  proposalId: string;
  reason: string;
}

export interface ProposalCreationValues {
  title: string;
  description: string;
  url: string;
}

export enum ProposalStatus {
  Active = 'Active',
  Counting = 'Counting',
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  Faulty = 'Faulty',
}

export interface ProposalDetail {
  proposalId: string;
  daoId: string;
  creator: string;
  birthBlock: number;
  metadataUrl: string | null;
  metadataHash: string | null;
  status: ProposalStatus | null;
  inFavor: BigNumber;
  against: BigNumber;
  proposalName: string | null;
  description: string | null;
  link: string | null;
}

export interface TxnNotification {
  title: string;
  message: string;
  type: TxnResponse;
  timestamp: number;
  txnHash?: string;
}

export interface TransferFormValues {
  assetId: number;
  toAddress: string;
  amount: BigNumber;
}

export interface TokenRecipient {
  walletAddress: string;
  tokens: BigNumber; // this is before adding DAO units
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
  tokensToIssue: BigNumber; // fixme BN
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
  treasuryTokens: BigNumber;
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
  proposalDuration: number | null;
  proposalTokenDeposit: number;
  minimumMajority: number | null;
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

export interface WalletAccount {
  isConnected: boolean;
  publicKey: string;
  network: string;
  networkUrl: string;
  networkPassphrase: string;
}

export interface ElioState {
  currentDao: DaoDetail | null;
  daos: DaoDetail[] | null;
  currentWalletAccount: WalletAccount | null;
  currentProposalFaultyReports: FaultyReport[] | null;
  daoTokenBalance: BigNumber | null;
  isConnectModalOpen: boolean;
  isTxnProcessing: boolean;
  daoPage: DaoPage;
  isStartModalOpen: boolean;
  createDaoSteps: number;
  txnNotifications: TxnNotification[];
  currentProposals: ProposalDetail[] | null;
  proposalCreationValues: ProposalCreationValues | null;
  isFaultyModalOpen: boolean;
  isFaultyReportsOpen: boolean;
  sorobanServer: SorobanClient.Server;
  networkPassphrase: string;
}

export interface ElioActions {
  updateCurrentDao: (dao: DaoDetail | null) => void;
  updateIsConnectModalOpen: (isOpen: boolean) => void;
  updateIsTxnProcessing: (txnProcessing: boolean) => void;
  updateDaoPage: (daoPage: DaoPage) => void;
  updateIsStartModalOpen: (isStartModalOpen: boolean) => void;
  updateCreateDaoSteps: (createDaoSteps: number) => void;
  addTxnNotification: (txnNotification: TxnNotification) => void;
  removeTxnNotification: () => void;
  updateProposalCreationValues: (
    proposalCreationValues: ProposalCreationValues
  ) => void;
  updateIsFaultyModalOpen: (isFaultyModalOpen: boolean) => void;
  updateIsFaultyReportsOpen: (isFaultyReportsOpen: boolean) => void;
  getWallet: () => void;
  updateCurrentWalletAccount: (currentWalletAccount: WalletAccount | null) => void
}

export interface ElioStore extends ElioState, ElioActions {}

const useElioStore = create<ElioStore>()((set, get) => ({
  currentDao: null,
  currentWalletAccount: null,
  isConnectModalOpen: false,
  isTxnProcessing: false,
  daoPage: 'dashboard',
  isStartModalOpen: false,
  createDaoSteps: 1,
  daos: daoArray,
  txnNotifications: [],
  currentProposals: null,
  proposalCreationValues: null,
  daoTokenBalance: null,
  isFaultyModalOpen: false,
  isFaultyReportsOpen: false,
  currentProposalFaultyReports: null,
  sorobanServer: new SorobanClient.Server(SOROBAN_RPC_ENDPOINT),
  networkPassphrase: 'Test SDF Future Network ; October 2022',
  updateCurrentDao: (currentDao) => set({ currentDao }),
  updateIsConnectModalOpen: (isConnectModalOpen) => set({ isConnectModalOpen }),
  updateIsTxnProcessing: (isTxnProcessing) => set({ isTxnProcessing }),
  updateCurrentWalletAccount: (currentWalletAccount) => set({currentWalletAccount}),
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
  addTxnNotification: (newNotification) => {
    const oldTxnNotis = get().txnNotifications;
    // add the new noti to first index because we will start displaying notis from the last index
    const newNotis = [newNotification, ...oldTxnNotis];
    set({ txnNotifications: newNotis });
  },
  removeTxnNotification: () => {
    // first in first out
    const currentTxnNotis = get().txnNotifications;
    const newNotis = currentTxnNotis.slice(0, -1);
    set({ txnNotifications: newNotis });
  },
  updateCreateDaoSteps: (createDaoSteps) => set({ createDaoSteps }),

  updateProposalCreationValues: (proposalCreationValues) =>
    set({ proposalCreationValues }),
  updateIsFaultyModalOpen: (isFaultyModalOpen) => set({ isFaultyModalOpen }),
  updateIsFaultyReportsOpen: (isFaultyReportsOpen) =>
    set({ isFaultyReportsOpen }),
  getWallet: async () => {
    const connected = await isConnected();
    const networkDetails = await getNetworkDetails();
    const publicKey = await getPublicKey();
    const wallet: WalletAccount = {
      isConnected: connected,
      network: networkDetails.network,
      networkPassphrase: networkDetails.networkPassphrase,
      publicKey,
      networkUrl: networkDetails.networkUrl,
    };
    set({ currentWalletAccount: wallet });
  },
}));

export default useElioStore;
