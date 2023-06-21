import useElioStore from '@/stores/elioStore';
import { accountToScVal } from '@/utils';
import * as SorobanClient from 'soroban-client';
import { WalletNetwork } from 'stellar-wallets-kit';
import { BASE_FEE, ELIO_CORE_CONTRACT_ID } from '../config/index';

export enum TxnStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
}

const useElioDao = () => {
  const [currentWalletAccount, sorobanServer, networkPassphrase] = useElioStore(
    (s) => [s.currentWalletAccount, s.sorobanServer, s.networkPassphrase]
  );

  const getTxnBuilder = async (publicKey: string) => {
    const sourceAccount = await sorobanServer.getAccount(publicKey);
    return new SorobanClient.TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase,
    });
  };

  const makeCreateDaoTxn = async (
    daoId: string,
    daoName: string,
    owner: string
  ) => {
    const txnBuilder = await getTxnBuilder(owner);
    const contract = await new SorobanClient.Contract(ELIO_CORE_CONTRACT_ID);
    const txn = txnBuilder
      .addOperation(
        contract.call(
          'create_dao',
          SorobanClient.xdr.ScVal.scvString(daoId),
          SorobanClient.xdr.ScVal.scvString(daoName),
          accountToScVal(owner)
        )
      )
      .setTimeout(0)
      .build();

    return txn;
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

  const prepareTxn = async (unpreparedTxn: any) => {
    const preparedTxn = await sorobanServer.prepareTransaction(
      unpreparedTxn,
      networkPassphrase
    );

    return preparedTxn.toXDR();
  };

  const sendTxn = async (signedXDR: string) => {
    const tx = SorobanClient.TransactionBuilder.fromXDR(
      signedXDR,
      networkPassphrase
    );
    const res = await sorobanServer.simulateTransaction(tx);
    console.log(res);
    const sendResponse = await sorobanServer.sendTransaction(tx);

    if (sendResponse.errorResultXdr) {
      console.log(`can't send txn`);
    }

    if (sendResponse.status === 'PENDING') {
      // eslint-disable-next-line
      let txResponse = await sorobanServer.getTransaction(sendResponse.hash);

      while (txResponse.status === 'NOT_FOUND') {
        // eslint-disable-next-line
        txResponse = await sorobanServer.getTransaction(sendResponse.hash);
        // eslint-disable-next-line
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      return txResponse.resultXdr!;
      // eslint-disable-next-line no-else-return
    } else {
      throw new Error(
        `Unabled to submit transaction, status: ${sendResponse.status}`
      );
    }
  };

  const signTxn = async (xdr: string) => {
    if (!currentWalletAccount) {
      return;
    }
    const { signedXDR } = await currentWalletAccount.kit.sign({
      xdr,
      publicKey: currentWalletAccount.publicKey,
      network: WalletNetwork.FUTURENET,
    });
    // eslint-disable-next-line
    return signedXDR;
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
  };
};

export default useElioDao;
