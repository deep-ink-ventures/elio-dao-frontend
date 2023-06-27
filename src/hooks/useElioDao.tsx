import useElioStore from '@/stores/elioStore';
import { accountToScVal } from '@/utils';
import {
  signTransaction,
} from '@stellar/freighter-api';
import * as SorobanClient from 'soroban-client';
import {
  BASE_FEE,
  CORE_CONTRACT_ADDRESS,
  NETWORK_PASSPHRASE,
} from '../config/index';

export enum TxnStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
}

const useElioDao = () => {
  const [currentWalletAccount, sorobanServer, networkPassphrase] = useElioStore(
    (s) => [s.currentWalletAccount, s.sorobanServer, s.networkPassphrase]
  );

  // const getKP = () => {
  //   return SorobanClient.Keypair.fromSecret('SDFKRLBIRBFSILW5DXYGZKR6U6MK2H35AXRM467U6I3MCVYUULJQ27WA')
  // }
  const getTxnBuilder = async (publicKey: string) => {
    const sourceAccount = await sorobanServer.getAccount(publicKey);
    return new SorobanClient.TransactionBuilder(sourceAccount, {
      fee: '100',
      networkPassphrase: 'Test SDF Future Network ; October 2022',
    });
  };

  const makeCreateDaoTxn = async (
    daoId: string,
    daoName: string,
    owner: string
  ) => {
    const txnBuilder = await getTxnBuilder(owner);
    const daoIdBuffer = Buffer.from(daoId);
    const daoNameBuffer = Buffer.from(daoName);
    // use contract address
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

  const sendTxn = async (signedXDR: string) => {
    const tx = SorobanClient.TransactionBuilder.fromXDR(
      signedXDR,
      networkPassphrase
    );
    const res = await sorobanServer.simulateTransaction(tx);
    const sendResponse = await sorobanServer.sendTransaction(tx);

    console.log('send response', sendResponse);

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
    if (!currentWalletAccount) {
      return;
    }
    const signedResponse = signTransaction(xdr, {
      networkPassphrase: NETWORK_PASSPHRASE,
    });
    // eslint-disable-next-line
    return signedResponse;
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
