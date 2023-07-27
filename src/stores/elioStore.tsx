import { daoArray } from '@/stores/fakeData';
import {
  getNetworkDetails,
  getPublicKey,
  isConnected,
} from '@stellar/freighter-api';
import type BigNumber from 'bignumber.js';
import * as SorobanClient from 'soroban-client';
import { create } from 'zustand';

import { splitCamelCase } from '@/utils';
import {
  NETWORK,
  NETWORK_PASSPHRASE,
  SERVICE_URL,
  SOROBAN_RPC_ENDPOINT,
} from '../config/index';

import type { AccountSlice } from './account';
import { createAccountSlice } from './account';
import type { DaoSlice } from './dao';
import { createDaoSlice } from './dao';

interface ElioConfig {
  depositToCreateDao: number;
  depositToCreateProposal: number;
  blockCreationInterval: number;
  coreContractAddress: string;
  votesContractAddress: string;
  assetsWasmHash: string;
}

interface PageSlices {
  dao: DaoSlice;
  account: AccountSlice;
}
export type ContractName = 'core' | 'votes' | 'assets';

export interface ContractErrorCodes {
  core: {
    [key: string]: string;
  };
  votes: {
    [key: string]: string;
  };
  assets: {
    [key: string]: string;
  };
}
export const contractErrorCodes: ContractErrorCodes = {
  core: {
    0: 'DaoAlreadyExists',
    1: 'DaoDoesNotExist',
    2: 'VotesAlreadyInitiated',
    3: 'NotDaoOwner',
    4: 'AssetAlreadyIssued',
    5: 'AssetNotIssued',
    6: 'NoMetadata',
    7: 'NoHookpoint',
    8: 'MustRemoveConfigFirst',
  },
  votes: {
    0: 'CoreAlreadyInitialized',
    1: 'NotDaoOwner',
    2: 'MaxProposalsReached',
    3: 'ProposalNotFound',
    4: 'ProposalStillActive',
    5: 'ProposalNotRunning',
    6: 'UnacceptedProposal',
    7: 'NotProposalOwner',
    8: 'MetadataNotFound',
    9: 'ConfigurationNotFound',
  },
  assets: {
    0: 'NegativeAmount',
    1: 'CheckpointIndexError',
    2: 'InsufficientAllowance',
    3: 'DaoAlreadyIssuedToken',
    4: 'NotTokenOwner',
    5: 'CanOnlyBeMintedOnce',
    6: 'InsufficientBalance',
    7: 'NoCheckpoint',
  },
};

export enum Voting {
  MAJORITY = 'MAJORITY',
  CUSTOM = 'CUSTOM',
}

export interface GovConfigValues {
  daoId: string;
  proposalDuration: number;
  proposalTokenDeposit: BigNumber;
  voting: Voting;
  daoOwnerPublicKey: string;
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
  tokens: BigNumber; // this is before multiplying by DAO units
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
  tokensToIssue: BigNumber; 
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
  proposalTokenDeposit: number | null;
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
  pages: PageSlices;
  currentDao: DaoDetail | null;
  currentDaoFromChain: DaoDetail | null;
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
  currentProposal: ProposalDetail | null;
  currentProposals: ProposalDetail[] | null;
  proposalCreationValues: ProposalCreationValues | null;
  isFaultyModalOpen: boolean;
  isFaultyReportsOpen: boolean;
  sorobanServer: SorobanClient.Server;
  networkPassphrase: string;
  network: string;
  showCongrats: boolean;
  currentBlockNumber: number | null;
  elioConfig: ElioConfig | null;
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
  handleErrors: (
    errMsg: string,
    err?: Error,
    contractName?: ContractName
  ) => void;
  handleTxnSuccessNotification: (
    response: SorobanClient.SorobanRpc.GetTransactionResponse,
    successMsg: string
  ) => void;
  fetchDaosDB: () => void;
  fetchDaoDB: (daoId: string) => void;
  updateShowCongrats: (showCongrats: boolean) => void;
  updateDaoFromChain: (dao: DaoDetail) => void;
  updateCurrentBlockNumber: (currentBlockNumber: number | null) => void;
  fetchProposalFaultyReports: (proposalId: string) => void;
  fetchElioConfig: () => void;
}

export interface ElioStore extends ElioState, ElioActions {}

const useElioStore = create<ElioStore>()((set, get, store) => ({
  currentDao: daoArray[0]!,
  daos: daoArray,
  currentDaoFromChain: null,
  currentWalletAccount: null,
  isConnectModalOpen: false,
  isTxnProcessing: false,
  daoPage: 'dashboard',
  isStartModalOpen: false,
  createDaoSteps: 1,
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
  currentProposal: null,
  currentBlockNumber: null,
  elioConfig: null,
  updateCurrentDao: (currentDao) => set({ currentDao }),
  updateIsConnectModalOpen: (isConnectModalOpen) => set({ isConnectModalOpen }),
  updateIsTxnProcessing: (isTxnProcessing) => set({ isTxnProcessing }),
  updateCurrentWalletAccount: (currentWalletAccount) =>
    set({ currentWalletAccount }),
  updateDaoPage: (daoPage) => set(() => ({ daoPage })),
  updateIsStartModalOpen: (isStartModalOpen) =>
    set(() => ({ isStartModalOpen })),
  handleErrors: (
    errMsg: string,
    err?: Error | string,
    contractName?: ContractName
  ) => {
    console.log('contract name', contractName);
    set({ isTxnProcessing: false });
    // eslint-disable-next-line
    console.log(errMsg, err);
    let message = '';

    if (typeof err === 'object') {
      message = err.message;
    } else {
      message = errMsg;
    }

    const getErrorCode = (str: string | undefined) => {
      if (!str) {
        return null;
      }
      const startMarker = '#';
      const errorLines = str.split('\n');

      
      let errorCode: string | null = null;

      errorLines.some((line) => {
        const sanitizedLine = line.replace(/[()]/g, '');
        const start = sanitizedLine.indexOf(startMarker);

        if (start !== -1) {
          const end = sanitizedLine.indexOf(' ', start);
          errorCode =
            end === -1
              ? sanitizedLine.slice(start + 1) 
              : sanitizedLine.slice(start + 1, end); 
          return true; 
        }

        return false; 
      });

      return errorCode; 
    };

    const addErrorMsg = (errorCode: string, contract: ContractName) => {
      if (errorCode && contractErrorCodes[contract][errorCode]) {
        message = `${splitCamelCase(
          contractErrorCodes[contract][errorCode]!
        )} - ${message}`;
      }
    };

    if (
      contractName &&
      typeof err === 'string' &&
      err.includes('Error(Contract')
    ) {
      const errorCode = getErrorCode(err);
      if (errorCode) {
        addErrorMsg(errorCode, contractName);
      }
    }

    const newNoti = {
      title: TxnResponse.Error,
      message,
      type: TxnResponse.Error,
      timestamp: Date.now(),
    };

    get().addTxnNotification(newNoti);
  },
  handleTxnSuccessNotification(txnResponse, successMsg) {
    // we don't turn off txnIsProcessing here
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
          proposalDuration: dao.proposal_duration,
          proposalTokenDeposit: dao.proposal_token_deposit,
          minimumMajority: dao.minimum_majority_per_1024,
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
      if (newDaos.length < 1) {
        return;
      }
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
        proposalTokenDeposit: null,
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
        get().handleErrors('Cannot find this DAO');
        return;
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
  updateDaoFromChain: (currentDaoFromChain: DaoDetail) =>
    set({ currentDaoFromChain }),
  updateCurrentBlockNumber: (currentBlockNumber) => set({ currentBlockNumber }),
  fetchProposalFaultyReports: async (proposalId: string) => {
    try {
      const response = await fetch(
        `${SERVICE_URL}/proposals/${proposalId}/reports/`
      );

      const reportsRes = await response.json();

      if (!reportsRes || reportsRes.length < 1) {
        return;
      }

      const reports = reportsRes?.map(
        (item: { proposal_id: string; reason: string }) => {
          return {
            proposalId: item.proposal_id,
            reason: item.reason,
          };
        }
      );

      set({ currentProposalFaultyReports: reports });
    } catch (err) {
      get().handleErrors(err);
    }
  },
  fetchElioConfig: async () => {
    try {
      const response = await fetch(`${SERVICE_URL}/config/`);
      const config = await response.json();
      const elioConfig: ElioConfig = {
        depositToCreateDao: config.deposit_to_create_dao,
        depositToCreateProposal: config.deposit_to_create_proposal,
        blockCreationInterval: config.block_creation_interval,
        coreContractAddress: config.core_contract_address,
        votesContractAddress: config.votes_contract_address,
        assetsWasmHash: config.assets_wasm_hash,
      };
      set({ elioConfig });
    } catch (err) {
      get().handleErrors('Cannot fetch contract addresses', err);
    }
  },
  pages: {
    ...createDaoSlice(set, get, store),
    ...createAccountSlice(set, get, store),
  },
}));

export default useElioStore;
