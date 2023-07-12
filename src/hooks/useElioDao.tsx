import type {
  CreateDaoData,
  DaoMetadataValues,
  GovConfigValues,
} from '@/stores/elioStore';
import useElioStore, { Voting } from '@/stores/elioStore';
import {
  accountToScVal,
  bigNumberToScVal,
  decodeXdr,
  hexToScVal,
  numberToScVal,
  stringToScVal,
} from '@/utils';
import { signTransaction } from '@stellar/freighter-api';
import BigNumber from 'bignumber.js';
import { useRouter } from 'next/router';
import * as SorobanClient from 'soroban-client';
import {
  ASSETS_WASM_HASH,
  BASE_FEE,
  CORE_CONTRACT_ADDRESS,
  DAO_UNITS,
  SERVICE_URL,
  VOTES_CONTRACT_ADDRESS,
} from '../config/index';

export enum TxnStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
}

const useElioDao = () => {
  const router = useRouter();

  const [
    currentWalletAccount,
    sorobanServer,
    updateIsTxnProcessing,
    handleErrors,
    updateIsStartModalOpen,
    fetchDaoDB,
    updateCreateDaoSteps,
    handleTxnSuccessNotification,
    networkPassphrase,
    network,
  ] = useElioStore((s) => [
    s.currentWalletAccount,
    s.sorobanServer,
    s.updateIsTxnProcessing,
    s.handleErrors,
    s.updateIsStartModalOpen,
    s.fetchDaoDB,
    s.updateCreateDaoSteps,
    s.handleTxnSuccessNotification,
    s.networkPassphrase,
    s.network,
  ]);

  const handleTxnResponse = async (
    sendTxnResponse: SorobanClient.SorobanRpc.SendTransactionResponse,
    successMsg: string,
    errorMsg: string,
    cb?: Function
  ) => {
    if (sendTxnResponse.errorResultXdr) {
      console.log(`Cannot send transaction`);
    }

    if (sendTxnResponse.status === 'PENDING') {
      // eslint-disable-next-line
      let txResponse = await sorobanServer.getTransaction(sendTxnResponse.hash);

      while (txResponse.status === 'NOT_FOUND') {
        // eslint-disable-next-line
        txResponse = await sorobanServer.getTransaction(sendTxnResponse.hash);
        // eslint-disable-next-line
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (txResponse.status === 'SUCCESS') {
        console.log(txResponse.status);
        handleTxnSuccessNotification(txResponse, successMsg);
        if (cb) {
          cb();
        }
      }

      if (txResponse.status === 'FAILED') {
        handleErrors(errorMsg);
      }

      return txResponse;
      // eslint-disable-next-line no-else-return
    } else {
      // handle error here

      throw new Error(
        `Unabled to submit transaction, status: ${sendTxnResponse.status}`
      );
    }
  };

  const prepareTxn = async (
    unpreparedTxn: SorobanClient.Transaction<
      SorobanClient.Memo<SorobanClient.MemoType>
    >,
    networkPassphraseStr: string
  ) => {
    const preparedTxn = await sorobanServer.prepareTransaction(
      unpreparedTxn,
      networkPassphraseStr
    );

    return preparedTxn.toXDR();
  };

  const signTxn = async (
    xdr: string,
    networkPassphraseStr: string,
    networkStr: string,
    accountToSign: string
  ) => {
    const signedResponse = await signTransaction(xdr, {
      networkPassphrase: networkPassphraseStr,
      network: networkStr,
      accountToSign,
    });
    return signedResponse;
  };

  const sendTxn = async (signedXDR: string, networkPassphraseStr: string) => {
    const tx = SorobanClient.TransactionBuilder.fromXDR(
      signedXDR,
      networkPassphraseStr
    );
    const sendResponse = await sorobanServer.sendTransaction(tx);
    return sendResponse;
  };

  // use this to send transaction
  const submitTxn = async (
    unpreparedTxn: SorobanClient.Transaction<
      SorobanClient.Memo<SorobanClient.MemoType>
    >,
    successMsg: string,
    errorMsg: string,
    cb?: Function
  ) => {
    if (!currentWalletAccount?.publicKey) {
      throw new Error('Wallet not connected');
    }
    updateIsTxnProcessing(true);
    try {
      const preparedTxn = await prepareTxn(unpreparedTxn, networkPassphrase);
      console.log('prepared', prepareTxn);
      const signedTxn = await signTxn(
        preparedTxn,
        networkPassphrase,
        network,
        currentWalletAccount.publicKey
      );
      console.log('signed', signedTxn);
      const txResponse = await sendTxn(signedTxn, networkPassphrase);
      handleTxnResponse(txResponse, successMsg, errorMsg, cb);
    } catch (err) {
      handleErrors('Send Transaction failed', err);
    }
  };

  const makeContractTxn = async (
    sourcePublicKey: string,
    contractAddress: string,
    method: string,
    ...params: SorobanClient.xdr.ScVal[]
  ): Promise<SorobanClient.Transaction> => {
    const contract = new SorobanClient.Contract(contractAddress);
    return new SorobanClient.TransactionBuilder(
      await sorobanServer.getAccount(sourcePublicKey),
      {
        fee: BASE_FEE,
        networkPassphrase,
      }
    )
      .addOperation(contract.call(method, ...params))
      .setTimeout(0)
      .build();
  };

  const getTxnBuilder = async (publicKey: string) => {
    const sourceAccount = await sorobanServer.getAccount(publicKey);
    return new SorobanClient.TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase,
    });
  };

  const makeCreateDaoTxn = async (
    createDaoData: CreateDaoData,
    owner: string
  ) => {
    const txnBuilder = await getTxnBuilder(owner);
    const contract = await new SorobanClient.Contract(CORE_CONTRACT_ADDRESS);
    const txn = txnBuilder
      .addOperation(
        contract.call(
          'create_dao',
          stringToScVal(createDaoData.daoId),
          stringToScVal(createDaoData.daoName),
          accountToScVal(owner)
        )
      )
      .setTimeout(0)
      .build();
    return txn;
  };

  const createDao = async (createDaoData: CreateDaoData) => {
    updateIsTxnProcessing(true);
    if (!currentWalletAccount?.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const txn = await makeCreateDaoTxn(
        createDaoData,
        currentWalletAccount.publicKey
      );
      await submitTxn(
        txn,
        'Created DAO successfully',
        'DAO Creation failed',
        () => {
          setTimeout(() => {
            fetchDaoDB(createDaoData.daoId);
            updateIsStartModalOpen(false);
            updateIsTxnProcessing(false);
            updateCreateDaoSteps(2);
            router.push(`/dao/${createDaoData.daoId}/customize`);
          }, 3500);
        }
      );
    } catch (err) {
      handleErrors('Create Dao failed', err);
    }
  };

  // post dao metadata to the DB
  const postDaoMetadata = async (daoId: string, data: DaoMetadataValues) => {
    const jsonData = JSON.stringify({
      email: data.email,
      description_short: data.shortOverview,
      description_long: data.longDescription,
      logo: data.imageString,
    });

    const metadataResponse = await fetch(
      `${SERVICE_URL}/daos/${daoId}/metadata/`,
      {
        method: 'POST',
        body: jsonData,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const metadata = await metadataResponse.json();
    if (!metadata.metadata_url) {
      handleErrors('Not able to upload metadata');
    }
    return metadata;
  };

  // set metadata onchain
  const setDaoMetadata = async (
    publicKey: string,
    daoId: string,
    data: DaoMetadataValues
  ) => {
    const metadata = await postDaoMetadata(daoId, data);

    try {
      const setMetadataTxn = await makeContractTxn(
        publicKey,
        CORE_CONTRACT_ADDRESS,
        'set_metadata',
        stringToScVal(daoId),
        stringToScVal(metadata.metadata_url),
        stringToScVal(metadata.metadata_hash),
        accountToScVal(publicKey)
      );
      await submitTxn(
        setMetadataTxn,
        'Metadata set successfully',
        'Set Metadata Transaction failed',
        () => {
          updateIsTxnProcessing(false);
        }
      );
    } catch (err) {
      handleErrors('set DAO Metadata failed', err);
    }
  };

  // to authenticate user access to post metadata to the DB
  const doChallenge = async (daoId: string, publicKey: string) => {
    try {
      const challengeRes = await fetch(
        `${SERVICE_URL}/daos/${daoId}/challenge/`
      );
      const challengeString = await challengeRes.json();
      if (!challengeString.challenge) {
        handleErrors('Error in retrieving ownership-validation challenge');
        return null;
      }
      const signerResult = await signTxn(
        challengeString.challenge,
        networkPassphrase,
        network,
        publicKey
      );

      if (!signerResult) {
        handleErrors('Not able to validate ownership');
        return null;
      }

      return signerResult;
    } catch (err) {
      handleErrors(err);
      return null;
    }
  };

  const destroyDao = async (daoId: string) => {
    updateIsTxnProcessing(true);
    if (!currentWalletAccount?.publicKey) {
      throw new Error('Wallet not connected');
    }
    try {
      const txn = await makeContractTxn(
        currentWalletAccount.publicKey,
        CORE_CONTRACT_ADDRESS,
        'destroy_dao',
        stringToScVal(daoId),
        accountToScVal(currentWalletAccount.publicKey)
      );
      await submitTxn(
        txn,
        `${daoId} has been destroyed`,
        'Destroy DAO Transaction Failed'
      );
    } catch (err) {
      handleErrors('Destroy DAO Transaction Failed', err);
    }
  };

  const setGovernanceConfig = async (config: GovConfigValues) => {
    console.log('setGovernanceConfig called');
    updateIsTxnProcessing(true);
    if (!currentWalletAccount?.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const txn = await makeContractTxn(
        currentWalletAccount.publicKey,
        VOTES_CONTRACT_ADDRESS,
        'set_configuration',
        stringToScVal(config.daoId),
        numberToScVal(config.proposalDuration),
        bigNumberToScVal(
          config.proposalTokenDeposit.multipliedBy(new BigNumber(DAO_UNITS))
        ),
        stringToScVal(Voting.MAJORITY),
        accountToScVal(config.daoOwnerPublicKey)
      );
      await submitTxn(
        txn,
        'Governance has been set up successfully',
        'Governance setup failed'
      );
    } catch (err) {
      handleErrors('Setting governance configurations failed', err);
    }
  };

  const createTokenContract = async (
    daoId: string,
    daoOwnerPublicKey: string
  ) => {
    console.log('createTokenContract called');
    updateIsTxnProcessing(true);
    if (!currentWalletAccount?.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const txn = await makeContractTxn(
        currentWalletAccount.publicKey,
        CORE_CONTRACT_ADDRESS,
        'issue_token',
        stringToScVal(daoId),
        accountToScVal(daoOwnerPublicKey),
        hexToScVal(ASSETS_WASM_HASH),
        // random 32 bytes for salt
        SorobanClient.xdr.ScVal.scvBytes(
          SorobanClient.Keypair.random().rawSecretKey()
        )
      );
      await submitTxn(
        txn,
        'Created token contract successfully',
        'Token contract creation failed'
      );
    } catch (err) {
      handleErrors('Token contract creation failed', err);
    }
  };

  const mintToken = async (tokenAddress: string, supply: BigNumber) => {
    updateIsTxnProcessing(true);
    if (!currentWalletAccount?.publicKey) {
      throw new Error('Wallet not connected');
    }
    console.log('mintToken called');
    console.log('token address', tokenAddress);
    try {
      const txn = await makeContractTxn(
        currentWalletAccount.publicKey,
        tokenAddress,
        'mint_token',
        accountToScVal(currentWalletAccount.publicKey),
        bigNumberToScVal(supply.multipliedBy(new BigNumber(DAO_UNITS)))
      );
      await submitTxn(
        txn,
        'Tokens minted successfully',
        'Token minting failed'
      );
    } catch (err) {
      handleErrors('Token minting failed', err);
    }
  };

  const getAssetId = async (daoId: string) => {
    updateIsTxnProcessing(true);
    if (!currentWalletAccount?.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const txn = await makeContractTxn(
        currentWalletAccount.publicKey,
        CORE_CONTRACT_ADDRESS,
        'get_dao_asset_id',
        stringToScVal(daoId)
      );
      const res = await sorobanServer.simulateTransaction(txn);
      const xdr = res.results[0]?.xdr;
      const val = decodeXdr(xdr as string);
      return val;
    } catch (err) {
      handleErrors('getAssetId failed', err);
      return null;
    }
  };

  const issueTokenSetConfig = async ({
    daoId,
    daoOwnerPublicKey,
    proposalDuration,
    proposalTokenDeposit,
    voting,
    tokenSupply,
  }: {
    daoId: string;
    daoOwnerPublicKey: string;
    proposalDuration: number;
    proposalTokenDeposit: BigNumber;
    voting: Voting;
    tokenSupply: BigNumber;
  }) => {
    try {
      await createTokenContract(daoId, daoOwnerPublicKey);
      const tokenContractAddress = await getAssetId(daoId);
      if (!tokenContractAddress) {
        handleErrors('Cannot find token contract address');
        return;
      }
      console.log('Token Address', tokenContractAddress);
      await mintToken(tokenContractAddress as string, tokenSupply);
      // await setGovernanceConfig({
      //   daoId,
      //   daoOwnerPublicKey,
      //   proposalDuration,
      //   proposalTokenDeposit,
      //   voting,
      // });
    } catch (err) {
      handleErrors(err);
    }
  };

  return {
    makeCreateDaoTxn,
    createDao,
    doChallenge,
    setDaoMetadata,
    destroyDao,
    setGovernanceConfig,
    createTokenContract,
    mintToken,
    getAssetId,
    issueTokenSetConfig,
  };
};

export default useElioDao;
