import {
  getNetworkDetails,
  getPublicKey,
  isConnected,
} from '@stellar/freighter-api';
import type BigNumber from 'bignumber.js';
import * as SorobanClient from 'soroban-client';
import { create } from 'zustand';
import {
  NETWORK,
  NETWORK_PASSPHRASE,
  SERVICE_URL,
  SOROBAN_RPC_ENDPOINT,
} from '../config/index';
import { daoArray } from './fakeData';

export const errorCodeMessages: ErrorCodeMessages = {
  1: 'DAO already exists',
};

export enum Voting {
  MAJORITY = 'MAJORITY',
  CUSTOM = 'CUSTOM',
}

export interface ContractAddresses {
  core: string;
  assets: string;
  votes: string;
}

export interface GovConfigValues {
  daoId: string;
  proposalDuration: number;
  proposalTokenDeposit: BigNumber;
  voting: Voting;
  daoOwnerPublicKey: string;
}
export interface ErrorCodeMessages {
  [key: string]: string;
}

export interface FaultyReport {
  proposalId: string;
  reason: string;
}

export interface ProposalCreationValues {
  title: string;
  description: string;
  url: string;
}

export interface DaoMetadataValues {
  email: string;
  shortOverview: string;
  longDescription: string;
  logoImage: FileList;
  imageString: string;
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
  network: string;
  showCongrats: boolean;
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
  updateCurrentWalletAccount: (
    currentWalletAccount: WalletAccount | null
  ) => void;
  handleErrors: (errMsg: string, err?: Error) => void;
  handleTxnSuccessNotification: (
    response: SorobanClient.SorobanRpc.GetTransactionResponse,
    successMsg: string
  ) => void;
  fetchDaosDB: () => void;
  fetchDaoDB: (daoId: string) => void;
  updateShowCongrats: (showCongrats: boolean) => void;
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
  networkPassphrase: NETWORK_PASSPHRASE,
  network: NETWORK,
  showCongrats: false,
  updateCurrentDao: (currentDao) => set({ currentDao }),
  updateIsConnectModalOpen: (isConnectModalOpen) => set({ isConnectModalOpen }),
  updateIsTxnProcessing: (isTxnProcessing) => set({ isTxnProcessing }),
  updateCurrentWalletAccount: (currentWalletAccount) =>
    set({ currentWalletAccount }),
  updateDaoPage: (daoPage) => set(() => ({ daoPage })),
  updateIsStartModalOpen: (isStartModalOpen) =>
    set(() => ({ isStartModalOpen })),
  handleErrors: (errMsg: string, err?: Error | string) => {
    // eslint-disable-next-line
    console.log(errMsg);
    let message = '';

    if (typeof err === 'object') {
      message = err.message;
    } else {
      message = errMsg;
    }

    if (typeof err === 'string' && err.includes('ContractError(')) {
      const i = err.indexOf('ContractError(');
      const indexOfErrorCode = i + 14;
      // fixme when we have double digits error codes
      const errorCode = err.substring(indexOfErrorCode, indexOfErrorCode + 1);
      if (errorCodeMessages[errorCode]) {
        if (typeof err === 'object') {
          message = errorCodeMessages[errorCode] as string;
        } else {
          message = `${errorCodeMessages[errorCode] as string} - ${message}`;
        }
      }
    }

    const newNoti = {
      title: TxnResponse.Error,
      message,
      type: TxnResponse.Error,
      timestamp: Date.now(),
    };

    // eslint-disable-next-line
    set({ isTxnProcessing: false });
    get().addTxnNotification(newNoti);
  },
  handleTxnSuccessNotification(txnResponse, successMsg) {
    if (txnResponse.status !== 'SUCCESS') {
      return;
    }

    const noti = {
      title: TxnResponse.Success,
      message: successMsg,
      type: TxnResponse.Success,
      timestamp: Date.now(),
      // txnHash?: string;
    };
    set({ isTxnProcessing: false });
    get().addTxnNotification(noti);
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
    // wallet is automatically injected to the window we just need to get the values
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
  fetchDaosDB: async () => {
    try {
      const getDaosResponse = await fetch(
        `${SERVICE_URL}/daos/?order_by=id&limit=100`
      );
      const daosRes = await getDaosResponse.json();
      const daosArr = daosRes.results;
      const newDaos: DaoDetail[] = daosArr?.map((dao: any) => {
        return {
          daoId: dao.id,
          daoName: dao.name,
          daoAssetId: dao.asset_id,
          daoOwnerAddress: dao.owner_id,
          daoCreatorAddress: dao.creator_id,
          setupComplete: dao.setup_complete,
          metadataUrl: dao.metadata_url,
          metadataHash: dao.metadata_hash,
          email: dao.metadata?.email || null,
          descriptionShort: dao.metadata?.description_short || null,
          descriptionLong: dao.metadata?.description_long || null,
          images: {
            contentType: dao.metadata?.images.logo.content_type || null,
            small: dao.metadata?.images.logo.small.url || null,
            medium: dao.metadata?.images.logo.medium.url || null,
            large: dao.metadata?.images.logo.medium.url || null,
          },
        };
      });
      set({ daos: newDaos });
    } catch (err) {
      get().handleErrors(err);
    }
  },
  fetchDaoDB: async (daoId: string) => {
    try {
      const daoDetail: DaoDetail = {
        daoId: '{N/A}',
        daoName: '{N/A}',
        daoOwnerAddress: '{N/A}',
        daoCreatorAddress: '{N/A}',
        setupComplete: false,
        proposalDuration: null,
        proposalTokenDeposit: 0,
        minimumMajority: null,
        daoAssetId: null,
        metadataUrl: null,
        metadataHash: null,
        descriptionShort: null,
        descriptionLong: null,
        email: null,
        images: {
          contentType: null,
          small: null,
          medium: null,
          large: null,
        },
      };
      const response = await fetch(
        `${SERVICE_URL}/daos/${encodeURIComponent(daoId as string)}/`
      );
      if (response.status === 404) {
        throw new Error('Fetching failed. Status 404.');
      }
      const d = await response.json();
      daoDetail.daoId = d.id;
      daoDetail.daoName = d.name;
      daoDetail.daoAssetId = d.asset_id;
      daoDetail.daoOwnerAddress = d.owner_id;
      daoDetail.daoCreatorAddress = d.creator_id;
      daoDetail.proposalDuration = d.proposal_duration;
      daoDetail.proposalTokenDeposit = d.proposal_token_deposit;
      daoDetail.minimumMajority = d.minimum_majority_per_1024;
      daoDetail.metadataUrl = d.metadata_url;
      daoDetail.metadataHash = d.metadata_hash;
      daoDetail.setupComplete = d.setup_complete;

      if (d.metadata) {
        daoDetail.descriptionShort = d.metadata.description_short;
        daoDetail.descriptionLong = d.metadata.description_long;
        daoDetail.email = d.metadata.email;
        daoDetail.images.contentType = d.metadata.images.logo.content_type;
        daoDetail.images.small = d.metadata.images.logo.small.url;
        daoDetail.images.medium = d.metadata.images.logo.medium.url;
        daoDetail.images.large = d.metadata.images.logo.large.url;
      }

      get().updateCurrentDao(daoDetail);
    } catch (err) {
      get().handleErrors(err);
    }
  },
  updateShowCongrats: (showCongrats) => set({ showCongrats }),
}));

export default useElioStore;
