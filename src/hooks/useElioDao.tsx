import type {
  CreateDaoData,
  DaoMetadataValues,
  GovConfigValues,
} from '@/stores/elioStore';
import useElioStore, { Voting } from '@/stores/elioStore';
import {
  bigNumberToi128ScVal,
  accountToScVal,
  decodeXdr,
  hexToScVal,
  numberToScVal,
  stringToScVal,
} from '@/utils';
import { signTransaction } from '@stellar/freighter-api';
import BigNumber from 'bignumber.js';
import { useRouter } from 'next/router';
import * as SorobanClient from 'soroban-client';
import { BASE_FEE, DAO_UNITS, SERVICE_URL } from '../config/index';

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
    elioConfig,
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
    s.elioConfig,
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
      handleErrors(
        `Unabled to submit transaction, status: ${sendTxnResponse.status}`
      );
      return null;
    }
  };

  const prepareTxn = async (
    unpreparedTxn: SorobanClient.Transaction<
      SorobanClient.Memo<SorobanClient.MemoType>
    >,
    networkPassphraseStr: string
  ) => {
    try {
      const preparedTxn = await sorobanServer.prepareTransaction(
        unpreparedTxn,
        networkPassphraseStr
      );
      console.log('prepared txn', preparedTxn.toXDR());
      return preparedTxn.toXDR();
    } catch (err) {
      handleErrors('cannot prepare transaction', err);
      return null;
    }
  };

  const getTxnBuilder = async (
    publicKey: string
  ): Promise<SorobanClient.TransactionBuilder> => {
    const sourceAccount = await sorobanServer.getAccount(publicKey);
    return new SorobanClient.TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase,
    });
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
    if (!elioConfig) {
      handleErrors('Cannot fetch contract addresses');
      return;
    }
    updateIsTxnProcessing(true);
    console.log('submitting transaction...');
    try {
      console.log('unprepared txn', unpreparedTxn.toXDR());
      const preparedTxn = await prepareTxn(unpreparedTxn, networkPassphrase);
      if (!preparedTxn) {
        handleErrors('Transaction preparation failed');
        return;
      }
      const signedTxn = await signTxn(
        preparedTxn,
        networkPassphrase,
        network,
        currentWalletAccount!.publicKey
      );
      console.log('signed XDR', signedTxn);
      const txResponse = await sendTxn(signedTxn, networkPassphrase);
      handleTxnResponse(txResponse, successMsg, errorMsg, cb);
    } catch (err) {
      handleErrors('Send Transaction failed', err);
    }
  };

  const submitReadTxn = async (
    txn: SorobanClient.Transaction<SorobanClient.Memo<SorobanClient.MemoType>>
  ) => {
    try {
      const res = await sorobanServer.simulateTransaction(txn);
      const xdr = res?.results?.[0]?.xdr;
      if (!xdr) {
        return;
      }
      return decodeXdr(xdr as string);
    } catch (err) {
      handleErrors('Cannot submit read transaction', err);
      return null;
    }
  };

  const makeContractTxn = async (
    sourcePublicKey: string,
    contractAddress: string,
    method: string,
    ...params: SorobanClient.xdr.ScVal[]
  ): Promise<SorobanClient.Transaction> => {
    const contract = new SorobanClient.Contract(contractAddress);
    const txn = new SorobanClient.TransactionBuilder(
      await sorobanServer.getAccount(sourcePublicKey),
      {
        fee: BASE_FEE,
        networkPassphrase,
      }
    )
      .addOperation(contract.call(method, ...params))
      .setTimeout(0)
      .build();

    return txn;
  };

  const createDao = async (createDaoData: CreateDaoData) => {
    if (!elioConfig) {
      return;
    }
    updateIsTxnProcessing(true);

    try {
      const txn = await makeContractTxn(
        currentWalletAccount!.publicKey,
        elioConfig.coreContractAddress,
        'create_dao',
        stringToScVal(createDaoData.daoId),
        stringToScVal(createDaoData.daoName),
        accountToScVal(currentWalletAccount!.publicKey)
      );
      if (!txn) {
        return;
      }
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
    if (!elioConfig) {
      return;
    }
    try {
      const metadata = await postDaoMetadata(daoId, data);
      const setMetadataTxn = await makeContractTxn(
        publicKey,
        elioConfig.coreContractAddress,
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
    if (!elioConfig) {
      return;
    }
    updateIsTxnProcessing(true);

    try {
      const txn = await makeContractTxn(
        currentWalletAccount!.publicKey,
        elioConfig.coreContractAddress,
        'destroy_dao',
        stringToScVal(daoId),
        accountToScVal(currentWalletAccount!.publicKey)
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
    if (!elioConfig) {
      return;
    }
    updateIsTxnProcessing(true);
    try {
      const txn = await makeContractTxn(
        currentWalletAccount!.publicKey,
        elioConfig.votesContractAddress,
        'set_configuration',
        stringToScVal(config.daoId),
        numberToScVal(config.proposalDuration),
        bigNumberToi128ScVal(
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
    if (!elioConfig) {
      return;
    }
    updateIsTxnProcessing(true);
    try {
      const txn = await makeContractTxn(
        currentWalletAccount!.publicKey,
        elioConfig.coreContractAddress,
        'issue_token',
        stringToScVal(daoId),
        accountToScVal(daoOwnerPublicKey),
        hexToScVal(elioConfig.assetsWasmHash),
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
    try {
      const txn = await makeContractTxn(
        currentWalletAccount!.publicKey,
        tokenAddress,
        'mint_token',
        accountToScVal(currentWalletAccount!.publicKey),
        bigNumberToi128ScVal(supply.multipliedBy(new BigNumber(DAO_UNITS)))
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
    if (!elioConfig) {
      return;
    }
    try {
      const txn = await makeContractTxn(
        currentWalletAccount!.publicKey,
        elioConfig.coreContractAddress,
        'get_dao_asset_id',
        stringToScVal(daoId)
      );
      const tokenAddress = (await submitReadTxn(txn)) as string;
      return tokenAddress;
    } catch (err) {
      handleErrors('getAssetId failed', err);
      return null;
    }
  };

  const getDaoMetadata = async (daoId: string) => {
    if (!elioConfig) {
      return;
    }
    try {
      const txn = await makeContractTxn(
        currentWalletAccount!.publicKey,
        elioConfig.coreContractAddress,
        'get_metadata',
        stringToScVal(daoId)
      );
      const val = await submitReadTxn(txn);
      return val;
    } catch (err) {
      handleErrors('getDaoMetadata failed', err);
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
    const tokenContractAddress = await getAssetId(daoId);
    if (!tokenContractAddress) {
      console.log('Creating token contract');
      createTokenContract(daoId, daoOwnerPublicKey)
        .then(() => {
          setTimeout(async () => {
            const tokenAddress = await getAssetId(daoId);
            if (!tokenAddress) {
              handleErrors('Cannot get token address');
              return;
            }
            await mintToken(tokenAddress as string, tokenSupply);
          }, 6000);
        })
        .catch((err) => {
          handleErrors('issueTokenSetConfig failed', err);
        });
    } else {
      console.log('Token Address exists. Minting tokens.');
      await mintToken(tokenContractAddress as string, tokenSupply);
    }

    // fixme
    // await setGovernanceConfig({
    //   daoId,
    //   daoOwnerPublicKey,
    //   proposalDuration,
    //   proposalTokenDeposit,
    //   voting,
    // });
  };

  const getDao = async (daoId: string) => {
    if (!currentWalletAccount?.publicKey || !elioConfig) {
      return;
    }
    try {
      const txn = await makeContractTxn(
        currentWalletAccount?.publicKey,
        elioConfig.coreContractAddress,
        'get_dao',
        stringToScVal(daoId)
      );
      const val = await submitReadTxn(txn);
      return val;
    } catch (err) {
      handleErrors('getDao failed', err);
      return null;
    }
  };

  const changeOwner = async (daoId: string, newOwnerAddress: string) => {
    if (!elioConfig) {
      return;
    }
    updateIsTxnProcessing(true);
    try {
      const txn = await makeContractTxn(
        currentWalletAccount!.publicKey,
        elioConfig.coreContractAddress,
        'change_owner',
        stringToScVal(daoId),
        accountToScVal(newOwnerAddress),
        accountToScVal(currentWalletAccount!.publicKey)
      );
      await submitTxn(
        txn,
        'DAO owner changed successfully',
        'DAO owner change failed'
      );
    } catch (err) {
      handleErrors('changeOwner failed', err);
    }
  };

  const createProposal = async (daoId: string) => {
    if (!elioConfig) {
      return;
    }
    updateIsTxnProcessing(true);
    try {
      const txn = await makeContractTxn(
        currentWalletAccount!.publicKey,
        elioConfig.votesContractAddress,
        'create_proposal',
        stringToScVal(daoId),
        accountToScVal(currentWalletAccount!.publicKey)
      );
      await submitTxn(
        txn,
        'Proposal created successfully',
        'Proposal creation failed'
      );
    } catch (err) {
      handleErrors('CreateProposal failed', err);
    }
  };

  const setProposalMetadata = async (
    daoId: string,
    proposalId: number,
    meta: string,
    hash: string
  ) => {
    if (!elioConfig) {
      return;
    }
    updateIsTxnProcessing(true);
    try {
      const txn = await makeContractTxn(
        currentWalletAccount!.publicKey,
        elioConfig.votesContractAddress,
        'set_metadata',
        stringToScVal(daoId),
        SorobanClient.nativeToScVal(proposalId),
        stringToScVal(meta),
        stringToScVal(hash),
        accountToScVal(currentWalletAccount!.publicKey)
      );
      await submitTxn(
        txn,
        'Proposal created successfully',
        'Proposal creation failed'
      );
    } catch (err) {
      handleErrors('setProposalMetadata failed', err);
    }
  };

  const vote = async (daoId: string, proposalId: number, inFavor: boolean) => {
    if (!elioConfig) {
      return;
    }
    updateIsTxnProcessing(true);
    try {
      const txn = await makeContractTxn(
        currentWalletAccount!.publicKey,
        elioConfig.votesContractAddress,
        'set_metadata',
        stringToScVal(daoId),
        SorobanClient.nativeToScVal(proposalId),
        SorobanClient.nativeToScVal(inFavor),
        accountToScVal(currentWalletAccount!.publicKey)
      );
      await submitTxn(txn, 'Voted successfully', 'Voting failed');
    } catch (err) {
      handleErrors('vote failed', err);
    }
  };

  // can use this to transfer token to an individual account too
  const transferDaoTokens = async (
    daoId: string,
    toPublicKeys: string[],
    amount: BigNumber[]
  ) => {
    if (!currentWalletAccount) {
      return;
    }
    const tokenContractAddress = await getAssetId(daoId);
    if (!tokenContractAddress) {
      handleErrors('Cannot get token contract address');
      return;
    }
    const contract = new SorobanClient.Contract(tokenContractAddress);
    const txnBuilder = await getTxnBuilder(currentWalletAccount.publicKey);
    toPublicKeys.forEach((p, i) => {
      txnBuilder.addOperation(
        contract.call(
          'xfer',
          accountToScVal(currentWalletAccount.publicKey),
          accountToScVal(p),
          bigNumberToi128ScVal(amount[i]!)
        )
      );
    });
    const txn = txnBuilder.build();
    await submitTxn(txn, 'Transferred successfully', 'Transfer failed');
  };

  return {
    getTxnBuilder,
    submitReadTxn,
    makeContractTxn,
    createDao,
    doChallenge,
    setDaoMetadata,
    destroyDao,
    setGovernanceConfig,
    createTokenContract,
    mintToken,
    getAssetId,
    issueTokenSetConfig,
    getDaoMetadata,
    getDao,
    changeOwner,
    createProposal,
    setProposalMetadata,
    vote,
    transferDaoTokens,
  };
};

export default useElioDao;
