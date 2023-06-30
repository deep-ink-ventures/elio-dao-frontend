import type { CreateDaoData, DaoMetadataValues } from '@/stores/elioStore';
import useElioStore from '@/stores/elioStore';
import { accountToScVal, stringToScVal } from '@/utils';
import { signTransaction } from '@stellar/freighter-api';
import * as SorobanClient from 'soroban-client';
import {
  BASE_FEE,
  CORE_CONTRACT_ADDRESS,
  NETWORK,
  NETWORK_PASSPHRASE,
  SERVICE_URL,
} from '../config/index';

export enum TxnStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
}

const useElioDao = () => {
  const [
    currentWalletAccount,
    sorobanServer,
    networkPassphrase,
    updateIsTxnProcessing,
    handleErrors,
    handleTxnSuccess,
  ] = useElioStore((s) => [
    s.currentWalletAccount,
    s.sorobanServer,
    s.networkPassphrase,
    s.updateIsTxnProcessing,
    s.handleErrors,
    s.handleTxnSuccess,
  ]);

  const handleTxnResponse = async (
    sendTxnResponse: SorobanClient.SorobanRpc.SendTransactionResponse,
    successMsg: string,
    errorMsg: string
  ) => {
    if (sendTxnResponse.errorResultXdr) {
      console.log(`can't send txn`);
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
        handleTxnSuccess(txResponse, successMsg);
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

  const getTxnBuilder = async (publicKey: string) => {
    const sourceAccount = await sorobanServer.getAccount(publicKey);
    return new SorobanClient.TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    });
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
      .setTimeout(SorobanClient.TimeoutInfinite)
      .build();
  };

  const prepareTxn = async (
    unpreparedTxn: SorobanClient.Transaction<
      SorobanClient.Memo<SorobanClient.MemoType>
    >
  ) => {
    const preparedTxn = await sorobanServer.prepareTransaction(
      unpreparedTxn,
      networkPassphrase
    );

    return preparedTxn.toXDR();
  };

  const signTxn = async (xdr: string) => {
    const signedResponse = await signTransaction(xdr, {
      networkPassphrase: NETWORK_PASSPHRASE,
      network: NETWORK,
      accountToSign: currentWalletAccount?.publicKey,
    });
    return signedResponse;
  };

  const sendTxn = async (signedXDR: string) => {
    const tx = SorobanClient.TransactionBuilder.fromXDR(
      signedXDR,
      networkPassphrase
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
    errorMsg: string
  ) => {
    updateIsTxnProcessing(true);
    try {
      const preparedTxn = await prepareTxn(unpreparedTxn);
      const signedTxn = await signTxn(preparedTxn);
      const txResponse = await sendTxn(signedTxn);
      handleTxnResponse(txResponse, successMsg, errorMsg);
    } catch (err) {
      handleErrors('Send Transaction failed', err);
    }
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
      await submitTxn(txn, 'Created DAO successfully', 'DAO Creation failed');
    } catch (err) {
      handleErrors('Create Dao failed', err);
      console.log(err);
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
        stringToScVal(metadata.metadata_hash)
      );
      await submitTxn(
        setMetadataTxn,
        'Metadata set successfully',
        'Set Metadata Transaction failed'
      );
    } catch (err) {
      handleErrors(err);
    }
  };

  const doChallenge = async (daoId: string) => {
    try {
      const challengeRes = await fetch(
        `${SERVICE_URL}/daos/${daoId}/challenge/`
      );
      const challengeString = await challengeRes.json();
      if (!challengeString.challenge) {
        handleErrors('Error in retrieving ownership-validation challenge');
        return null;
      }
      const signerResult = await signTxn(challengeString.challenge);

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

  return {
    makeContractTxn,
    sendTxn,
    signTxn,
    prepareTxn,
    makeCreateDaoTxn,
    submitTxn,
    createDao,
    doChallenge,
    handleTxnResponse,
    setDaoMetadata,
  };
};

export default useElioDao;
