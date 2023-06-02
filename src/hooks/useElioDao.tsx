import { useContractValue } from '@soroban-react/contracts';
import { useSorobanReact } from '@soroban-react/core';
import type { xdr } from 'soroban-client';
import * as SorobanClient from 'soroban-client';

const useElioDao = () => {
  // const { sendTransaction } = useSendTransaction()
  const sorobanContext = useSorobanReact();

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

  return {
    makeContractTxn,
    useLoadToken,
  };
};

export default useElioDao;
