import { SERVICE_URL } from '@/config';
import useElioDao from '@/hooks/useElioDao';
import { McAccountService } from '@/services/multiCliqueAccount';
import useElioStore from '@/stores/elioStore';
import type { MultiCliqueAccount } from '@/types/multiCliqueAccount';
import { accountToScVal, numberToU32ScVal } from '@/utils/index';
import * as SorobanClient from 'soroban-client';

const useMC = () => {
  const [currentWalletAccount, handleErrors, elioConfig] = useElioStore((s) => [
    s.currentWalletAccount,
    s.handleErrors,
    s.elioConfig,
  ]);

  const { submitTxn, getTxnBuilder, makeContractTxn } = useElioDao();

  const makeCoreInstallationTxn = async () => {
    if (!currentWalletAccount) {
      return;
    }
    try {
      const response = await fetch(
        `${SERVICE_URL}/multiclique/contracts/create-multiclique-xdr/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source_account_address: currentWalletAccount.publicKey,
          }),
        }
      );
      const data = await response.json();
      return data.xdr;
    } catch (err) {
      handleErrors('Error in getting multiclique core contract address', err);
      return null;
    }
  };

  const makePolicyInstallationTxn = async () => {
    if (!currentWalletAccount) {
      return;
    }
    try {
      const response = await fetch(
        `${SERVICE_URL}/multiclique/contracts/create-policy-xdr/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source_account_address: currentWalletAccount.publicKey,
            policy_preset: 'ELIO_DAO',
          }),
        }
      );
      const data = await response.json();
      return data.xdr;
    } catch (err) {
      handleErrors('Error in getting multiclique policy contract address', err);
      return null;
    }
  };

  const installCoreContract = async (cb?: Function) => {
    if (!currentWalletAccount) {
      return;
    }
    try {
      const coreXdr = await makeCoreInstallationTxn();

      const txn = new SorobanClient.Transaction(
        coreXdr,
        elioConfig.networkPassphrase
      );
      const coreResult = await submitTxn(
        txn,
        'Multiclique core contract installed',
        'Error in Multiclique core contract installation',
        'multicliqueCore'
      );
      if (!coreResult || coreResult.status === 'FAILED') {
        throw new Error('Cannot get multiclique core address');
      }
      const coreId = coreResult.resultMetaXdr
        .v3()
        ?.sorobanMeta()
        ?.returnValue()
        .address()
        .contractId();
      if (!coreId) {
        throw new Error('Cannot decode policyId');
      }
      const coreContractAddress = SorobanClient.StrKey.encodeContract(coreId);
      if (cb) {
        cb(coreContractAddress);
      }
      return coreContractAddress;
    } catch (err) {
      handleErrors('Error in installing Multiclique core contract', err);
      return null;
    }
  };

  const installPolicyContract = async (cb?: Function) => {
    if (!currentWalletAccount) {
      return;
    }
    try {
      const coreXdr = await makePolicyInstallationTxn();

      const txn = new SorobanClient.Transaction(
        coreXdr,
        elioConfig.networkPassphrase
      );
      const policyResult = await submitTxn(
        txn,
        'Elio DAO policy contract installed',
        'Error in Elio DAO policy contract installation',
        'multicliqueCore'
      );
      if (!policyResult || policyResult.status === 'FAILED') {
        throw new Error('Cannot get Elio DAO policy address');
      }
      const policyId = policyResult.resultMetaXdr
        .v3()
        ?.sorobanMeta()
        ?.returnValue()
        .address()
        .contractId();

      if (!policyId) {
        throw new Error('Cannot decode policyId');
      }
      const policyContractAddress =
        SorobanClient.StrKey.encodeContract(policyId);
      if (cb) {
        await cb(policyContractAddress);
      }
      return policyContractAddress;
    } catch (err) {
      handleErrors('Error in installing Elio DAO policy contract', err);
      return null;
    }
  };

  const initMulticliqueCore = async (
    coreAddress: string,
    signerAddresses: string[],
    threshold: number,
    cb: Function
  ) => {
    if (!currentWalletAccount) {
      return;
    }

    const rawKeys = signerAddresses.map((addy) => {
      return SorobanClient.Keypair.fromPublicKey(addy).rawPublicKey();
    });

    const coreContract = new SorobanClient.Contract(coreAddress);
    const txnBuilder = await getTxnBuilder(currentWalletAccount?.publicKey);
    const txn = txnBuilder
      .addOperation(
        coreContract.call(
          'init',
          SorobanClient.nativeToScVal(rawKeys),
          numberToU32ScVal(threshold)
        )
      )
      .setTimeout(0)
      .build();
    await submitTxn(
      txn,
      'Initialized Multiclique Core ',
      'Error in initializing Multiclique Core',
      'multicliqueCore',
      cb
    );
  };

  const initMulticliquePolicy = async (
    policyAddress: string,
    contracts: {
      multiclique: string;
      elioCore: string;
      elioVotes: string;
      elioAssets: string;
    },
    cb?: Function
  ) => {
    if (!currentWalletAccount) {
      return;
    }

    const tx = await makeContractTxn(
      currentWalletAccount.publicKey,
      policyAddress,
      'init',
      ...Object.values(contracts).map((v) => accountToScVal(v))
    );
    await submitTxn(
      tx,
      'Initialized Elio DAO policy',
      'Error in initializing Elio DAO policy',
      'multicliquePolicy',
      cb
    );
  };

  const createMultisigDB = async (
    payload: MultiCliqueAccount,
    cb?: Function
  ) => {
    try {
      const response = await McAccountService.createMultiCliqueAccount(payload);
      if (cb) cb(response);
      return response;
    } catch (err) {
      handleErrors('Error in getting creating multiclique account', err);
      return null;
    }
  };

  return {
    installCoreContract,
    installPolicyContract,
    createMultisigDB,
    initMulticliqueCore,
    initMulticliquePolicy,
  };
};
export default useMC;
