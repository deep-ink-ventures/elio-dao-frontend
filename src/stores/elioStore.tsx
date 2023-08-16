import {
  ASSETS_WASM_HASH,
  BLOCK_TIME,
  CORE_CONTRACT_ADDRESS,
  DAO_CREATION_DEPOSIT_XLM,
  NETWORK,
  NETWORK_PASSPHRASE,
  PROPOSAL_CREATION_DEPOSIT_XLM,
  SERVICE_URL,
  SOROBAN_RPC_ENDPOINT,
  VOTES_CONTRACT_ADDRESS,
  XLM_UNITS,
} from '@/config';
import { splitCamelCase } from '@/utils';
import {
  getNetworkDetails,
  getPublicKey,
  isConnected,
} from '@stellar/freighter-api';
import BigNumber from 'bignumber.js';
import * as SorobanClient from 'soroban-client';
import * as StellarSdk from 'stellar-sdk';
import { create } from 'zustand';

import { DaoService } from '@/services/daos';
import type {
  IncomingProposal,
  ProposalStatusNames,
} from '@/services/proposals';
import { proposalStatusNames } from '@/services/proposals';
import type { AccountSlice } from './account';
import { createAccountSlice } from './account';
import type { DaoSlice } from './dao';
import { createDaoSlice } from './dao';

export interface ElioStats {
  daoCount: number;
  accountCount: number;
  proposalCount: number;
  voteCount: number;
}

export interface ElioConfig {
  depositToCreateDao: BigNumber;
  depositToCreateProposal: BigNumber;
  /** Block time in seconds */
  blockCreationInterval: number;
  coreContractAddress: string;
  votesContractAddress: string;
  assetsWasmHash: string;
  networkPassphrase: string;
  rpcEndpoint: string;
  currentBlockNumber?: number;
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
  /** Number of blocks */
  proposalDuration: number;
  // proposalTokenDeposit: BigNumber;
  /** In tokens. Must be in_favour + against E.g. if there is 1,000,000 tokens minted and the threshold is 10% you need to set it to 100,000  */
  minimumThreshold: BigNumber;
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
  /** This is before multiplying by DAO units */
  tokens: BigNumber;
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
  // proposalTokensCost: number;
  /** In percentage if it's 10 then it means 10% */
  minimumThresholdPercentage: number;
  /** In days */
  proposalDurationInDays: number;
}

export interface CouncilFormValues {
  creatorName: string;
  creatorWallet: string;
  councilMembers: CouncilMember[];
  //* *  number of councils needed to approve */
  councilThreshold: number;
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
  // proposalTokenDeposit: number | null;
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
  nativeTokenBalance: BigNumber;
}

export interface ElioState {
  pages: PageSlices;
  currentDao: DaoDetail | null;
  currentDaoFromChain: DaoDetail | null;
  daos: DaoDetail[] | null;
  currentWalletAccount: WalletAccount | null;
  currentProposalFaultyReports: FaultyReport[] | null;
  /** Raw token balance */
  daoTokenBalance: BigNumber | null;
  xlmTokenBalance: BigNumber | null;
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
  showCongrats: boolean;
  currentBlockNumber: number | null;
  elioConfig: ElioConfig;
  elioStats: ElioStats | null;
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
    proposalCreationValues: ProposalCreationValues | null
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
    successMsg: string,
    txnHash?: string
  ) => void;
  fetchDaosDB: () => void;
  fetchDaoDB: (daoId: string) => void;
  fetchDaoTokenBalanceFromDB: (daoId: string, accountId: string) => void;
  updateShowCongrats: (showCongrats: boolean) => void;
  updateDaoFromChain: (dao: DaoDetail) => void;
  updateCurrentBlockNumber: (currentBlockNumber: number | null) => void;
  updateDaoTokenBalance: (daoTokenBalance: BigNumber | null) => void;
  fetchProposalFaultyReports: (proposalId: string) => void;
  fetchElioConfig: () => void;
  fetchBlockNumber: () => void;
  fetchProposalsDB: (daoId: string) => void;
  fetchProposalDB: (daoId: string, proposalId: string) => void;
  fetchNativeTokenBalance: (
    publickey: string
  ) => Promise<string | null | undefined>;
  fetchElioStats: () => void;
}

export interface ElioStore extends ElioState, ElioActions {}

const useElioStore = create<ElioStore>()((set, get, store) => ({
  currentDao: null,
  daos: null,
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
  xlmTokenBalance: null,
  isFaultyModalOpen: false,
  isFaultyReportsOpen: false,
  currentProposalFaultyReports: null,
  sorobanServer: new SorobanClient.Server(SOROBAN_RPC_ENDPOINT[NETWORK]),
  showCongrats: false,
  currentProposal: null,
  currentBlockNumber: null,
  elioConfig: {
    depositToCreateDao: BigNumber(DAO_CREATION_DEPOSIT_XLM),
    depositToCreateProposal: BigNumber(PROPOSAL_CREATION_DEPOSIT_XLM),
    blockCreationInterval: BLOCK_TIME,
    coreContractAddress: CORE_CONTRACT_ADDRESS,
    votesContractAddress: VOTES_CONTRACT_ADDRESS,
    assetsWasmHash: ASSETS_WASM_HASH,
    networkPassphrase: NETWORK_PASSPHRASE.FUTURENET,
    rpcEndpoint: SOROBAN_RPC_ENDPOINT.FUTURENET,
  },
  elioStats: null,
  updateCurrentDao: (currentDao) => set({ currentDao }),
  updateIsConnectModalOpen: (isConnectModalOpen) => set({ isConnectModalOpen }),
  updateIsTxnProcessing: (isTxnProcessing) => set({ isTxnProcessing }),
  updateCurrentWalletAccount: (currentWalletAccount) =>
    set({ currentWalletAccount }),
  updateDaoPage: (daoPage) => set(() => ({ daoPage })),
  updateDaoTokenBalance: (daoTokenBalance) => set(() => ({ daoTokenBalance })),
  updateIsStartModalOpen: (isStartModalOpen) =>
    set(() => ({ isStartModalOpen })),
  handleErrors: (
    errMsg: string,
    err?: Error | string,
    contractName?: ContractName
  ) => {
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
  handleTxnSuccessNotification(txnResponse, successMsg, txnHash?) {
    // we don't turn off txnIsProcessing here
    if (txnResponse.status !== 'SUCCESS') {
      return;
    }

    const noti = {
      title: TxnResponse.Success,
      message: successMsg,
      type: TxnResponse.Success,
      timestamp: Date.now(),
      txnHash,
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
    const nativeBalance = await get().fetchNativeTokenBalance(publicKey);
    const wallet: WalletAccount = {
      isConnected: connected,
      network: networkDetails.network,
      networkPassphrase: networkDetails.networkPassphrase,
      publicKey,
      networkUrl: networkDetails.networkUrl,
      nativeTokenBalance: nativeBalance
        ? BigNumber(nativeBalance).multipliedBy(XLM_UNITS)
        : BigNumber(0),
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
        // proposalTokenDeposit: null,
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
      // daoDetail.proposalTokenDeposit = d.proposal_token_deposit;
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
      if (response.status >= 400 || !response.ok) {
        return;
      }
      const config = await response.json();
      const elioConfig: ElioConfig = {
        depositToCreateDao: config.deposit_to_create_dao,
        depositToCreateProposal: config.deposit_to_create_proposal,
        blockCreationInterval: config.block_creation_interval,
        coreContractAddress: config.core_contract_address,
        votesContractAddress: config.votes_contract_address,
        assetsWasmHash: config.assets_wasm_hash,
        networkPassphrase: config.network_passphrase,
        rpcEndpoint: config.blockchain_url,
        currentBlockNumber: config.current_block_number,
      };
      set({ elioConfig });
      set({ sorobanServer: new SorobanClient.Server(elioConfig.rpcEndpoint) });
    } catch (err) {
      get().handleErrors('Cannot fetch contract addresses', err);
    }
  },
  pages: {
    ...createDaoSlice(set, get, store),
    ...createAccountSlice(set, get, store),
  },
  fetchBlockNumber: async () => {
    try {
      const response = await fetch('https://horizon-futurenet.stellar.org/');
      if (response.status >= 400 || !response.ok) {
        return;
      }
      const horizonData = await response.json();
      set({ currentBlockNumber: Number(horizonData.history_latest_ledger) });
    } catch (err) {
      get().handleErrors('Cannot get block number', err);
    }
  },
  fetchDaoTokenBalanceFromDB: async (daoId: string, accountId: string) => {
    try {
      const daoTokenBalance = await DaoService.getBalance(daoId, accountId);
      set({ daoTokenBalance });
    } catch (err) {
      get().handleErrors(err);
    }
  },
  fetchProposalsDB: async (daoId) => {
    try {
      const response = await fetch(
        `${SERVICE_URL}/proposals/?dao_id=${daoId}&limit=100`
      );
      const json = await response.json();
      const newProposals = json.results
        .filter((p: IncomingProposal) => {
          // filter out proposals without offchain metadata
          return !!p.metadata_url === true;
        })
        .map((p: IncomingProposal) => {
          return {
            proposalId: p.id,
            daoId: p.dao_id,
            creator: p.creator_id,
            birthBlock: p.birth_block_number,
            metadataUrl: p.metadata_url || null,
            metadataHash: p.metadata_hash || null,
            status: proposalStatusNames[p.status as keyof ProposalStatusNames],
            inFavor: BigNumber(p.votes?.pro || 0),
            against: BigNumber(p.votes?.contra || 0),
            proposalName: p.metadata?.title || null,
            description: p.metadata?.description || null,
            link: p.metadata?.url || null,
            setupComplete: p.setup_complete,
          };
        });
      set({ currentProposals: newProposals });
    } catch (err) {
      get().handleErrors(err);
    }
  },
  fetchProposalDB: async (daoId, proposalId) => {
    try {
      const response = await fetch(
        `${SERVICE_URL}/proposals/?dao_id=${daoId}&id=${proposalId}`
      );

      const { results } = await response.json();
      if (!results) {
        return;
      }
      const p: IncomingProposal = results?.[0];
      const newProp = {
        proposalId: p.id,
        daoId: p.dao_id,
        creator: p.creator_id,
        birthBlock: p.birth_block_number,
        metadataUrl: p.metadata_url || null,
        metadataHash: p.metadata_hash || null,
        status:
          proposalStatusNames[p.status as keyof ProposalStatusNames] || null,
        inFavor: BigNumber(p.votes?.pro || 0),
        against: BigNumber(p.votes?.contra || 0),
        voterCount: BigNumber(p.votes?.total || 0),
        proposalName: p.metadata?.title || null,
        description: p.metadata?.description || null,
        link: p.metadata?.url || null,
        setupComplete: p.setup_complete,
      };
      set({ currentProposal: newProp });
    } catch (err) {
      get().handleErrors(err);
    }
  },
  fetchNativeTokenBalance: async (publicKey: string) => {
    try {
      const server = new StellarSdk.Server(
        'https://horizon-futurenet.stellar.org/'
      );
      const account = await server.loadAccount(publicKey);
      if (!account.accountId()) {
        get().handleErrors('We cannot find your account');
        return;
      }
      const nativeBalance = account.balances.filter((balance) => {
        return balance.asset_type === 'native';
      })[0]?.balance;
      return nativeBalance;
    } catch (err) {
      get().handleErrors(err);
      return null;
    }
  },
  fetchElioStats: async () => {
    try {
      const response = await fetch(`${SERVICE_URL}/stats/`);

      const data = await response.json();
      set({
        elioStats: {
          daoCount: data.dao_count,
          accountCount: data.account_count,
          proposalCount: data.proposal_count,
          voteCount: data.vote_count,
        },
      });
    } catch (err) {
      get().handleErrors('Cannot fetch Elio Stats', err);
    }
  },
}));

export default useElioStore;
