import type { CreateDaoData } from '@/stores/elioStore';
import useElioStore from '@/stores/elioStore';
import { accountToScVal } from '@/utils';
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
    const daoIdBuffer = Buffer.from(createDaoData.daoId);
    const daoNameBuffer = Buffer.from(createDaoData.daoName);
    const contract = await new SorobanClient.Contract(CORE_CONTRACT_ADDRESS);
    const txn = txnBuilder
      .addOperation(
        contract.call(
          'create_dao',
          // convert input value to buffer then ScVal
          SorobanClient.xdr.ScVal.scvBytes(daoIdBuffer),
          SorobanClient.xdr.ScVal.scvBytes(daoNameBuffer),
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

  const makeContractTxn = (
    source: SorobanClient.Account,
    contractId: string,
    method: string,
    ...params: SorobanClient.xdr.ScVal[]
  ): SorobanClient.Transaction => {
    const contract = new SorobanClient.Contract(contractId);
    return new SorobanClient.TransactionBuilder(source, {
      fee: BASE_FEE,
      networkPassphrase,
    })
      .addOperation(contract.call(method, ...params))
      .setTimeout(SorobanClient.TimeoutInfinite)
      .build();
  };

  const makeTokenBalanceTxn = async (
    address: string,
    tokenId: string,
    txBuilder: SorobanClient.TransactionBuilder
  ) => {
    const params = [new SorobanClient.Address(address).toScVal()];
    const contract = new SorobanClient.Contract(tokenId);
    const tx = txBuilder
      .addOperation(contract.call('balance', ...params))
      .setTimeout(SorobanClient.TimeoutInfinite)
      .build();

    return tx;
  };

  const makeTokenSymbolTxn = async (
    tokenId: string,
    txBuilder: SorobanClient.TransactionBuilder
  ) => {
    const contract = new SorobanClient.Contract(tokenId);
    const tx = txBuilder
      .addOperation(contract.call('symbol'))
      .setTimeout(SorobanClient.TimeoutInfinite)
      .build();

    return tx;
  };

  const makeTokenNameTxn = async (
    tokenId: string,
    txBuilder: SorobanClient.TransactionBuilder
  ) => {
    const contract = new SorobanClient.Contract(tokenId);
    const tx = txBuilder
      .addOperation(contract.call('name'))
      .setTimeout(SorobanClient.TimeoutInfinite)
      .build();

    return tx;
  };

  const getTokenDecimalsTxn = async (
    tokenId: string,
    txBuilder: SorobanClient.TransactionBuilder
  ) => {
    const contract = new SorobanClient.Contract(tokenId);
    const tx = txBuilder
      .addOperation(contract.call('decimals'))
      .setTimeout(SorobanClient.TimeoutInfinite)
      .build();

    return tx;
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

      console.log(signerResult);
      return signerResult;
    } catch (err) {
      handleErrors(err);
      return null;
    }
  };

  return {
    makeContractTxn,
    makeTokenBalanceTxn,
    makeTokenNameTxn,
    getTokenDecimalsTxn,
    makeTokenSymbolTxn,
    sendTxn,
    signTxn,
    prepareTxn,
    makeCreateDaoTxn,
    submitTxn,
    createDao,
    doChallenge,
    handleTxnResponse,
  };
};

export default useElioDao;
