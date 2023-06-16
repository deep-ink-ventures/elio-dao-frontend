import useElioStore from '@/stores/elioStore';
import { useContractValue } from '@soroban-react/contracts';
import { useSorobanReact } from '@soroban-react/core';
import type { xdr } from 'soroban-client';
import * as SorobanClient from 'soroban-client';

export enum TxnStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
}

const useElioDao = () => {
  // const { sendTransaction } = useSendTransaction()
  const sorobanContext = useSorobanReact();
  const [currentWalletAccount] = useElioStore((s) => [s.currentWalletAccount]);

  // Call the contract to get user's balance of the token
  const useLoadToken = (
    account: string,
    tokenId: string,
    params: xdr.ScVal[]
  ): any => {
    return {
      userBalance: useContractValue({
        contractId: tokenId,
        method: 'balance',
        params: [new SorobanClient.Address(account).toScVal() as any], // fixme
        sorobanContext,
      }),
      decimals: useContractValue({
        contractId: tokenId,
        method: 'decimals',
        sorobanContext,
      }),
      symbol: useContractValue({
        contractId: tokenId,
        method: 'symbol',
        sorobanContext,
      }),
    };
  };

  const makeContractTxn = (
    networkPassphrase: string,
    source: SorobanClient.Account,
    contractId: string,
    method: string,
    ...params: SorobanClient.xdr.ScVal[]
  ): SorobanClient.Transaction => {
    const contract = new SorobanClient.Contract(contractId);
    return new SorobanClient.TransactionBuilder(source, {
      // TODO: Figure out the fee
      fee: '100',
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
    txBuilder: SorobanClient.TransactionBuilder,
    server: SorobanClient.Server
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

  const sendTxn = async (
    signedXDR: string,
    networkPassphrase: string,
    server: SorobanClient.Server
  ) => {
    const tx = SorobanClient.TransactionBuilder.fromXDR(
      signedXDR,
      networkPassphrase
    );
    const sendResponse = await server.sendTransaction(tx);

    if (sendResponse.errorResultXdr) {
      console.log(`can't send txn`);
    }

    if (sendResponse.status === 'PENDING') {
      // eslint-disable-next-line
      let txResponse = await server.getTransaction(sendResponse.hash);

      while (txResponse.status === 'NOT_FOUND') {
        // eslint-disable-next-line
        txResponse = await server.getTransaction(sendResponse.hash);
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

  const signTxn = async (xdr: any) => {
    if (!currentWalletAccount) {
      return;
    }
    const { signedXDR } = await currentWalletAccount.kit.sign({
      xdr,
    });
    // eslint-disable-next-line
    return signedXDR;
  };

  return {
    makeContractTxn,
    useLoadToken,
    makeTokenBalanceTxn,
    makeTokenNameTxn,
    getTokenDecimalsTxn,
    makeTokenSymbolTxn,
    sendTxn,
    signTxn,
  };
};

export default useElioDao;
