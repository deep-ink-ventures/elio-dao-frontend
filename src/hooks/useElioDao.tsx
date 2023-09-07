import type {
  ContractName,
  CreateDaoData,
  DaoMetadataValues,
  GovConfigValues,
  ProposalCreationValues,
} from '@/stores/elioStore';
import useElioStore, { TxnResponse } from '@/stores/elioStore';
import {
  accountToScVal,
  bigNumberToI128ScVal,
  booleanToScVal,
  decodeXdr,
  hexToScVal,
  isStellarPublicKey,
  numberToU32ScVal,
  stringToScVal,
  toBase64,
} from '@/utils';
import { signBlob, signTransaction } from '@stellar/freighter-api';
import BigNumber from 'bignumber.js';
import { useRouter } from 'next/router';
import * as SorobanClient from 'soroban-client';
import {
  BASE_FEE,
  DAO_UNITS,
  NETWORK,
  NETWORK_PASSPHRASE,
  SERVICE_URL,
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
    handleTxnSuccessNotification,
    elioConfig,
    updateDaoPage,
    updateProposalCreationValues,
    addTxnNotification,
    updateIsFaultyModalOpen,
  ] = useElioStore((s) => [
    s.currentWalletAccount,
    s.sorobanServer,
    s.updateIsTxnProcessing,
    s.handleErrors,
    s.updateIsStartModalOpen,
    s.fetchDaoDB,
    s.handleTxnSuccessNotification,
    s.elioConfig,
    s.updateDaoPage,
    s.updateProposalCreationValues,
    s.addTxnNotification,
    s.updateIsFaultyModalOpen,
  ]);

  const handleTxnResponse = async (
    sendTxnResponse: SorobanClient.SorobanRpc.SendTransactionResponse,
    successMsg: string,
    errorMsg: string,
    cb?: Function
  ) => {
    console.log('sendTxnResponse', sendTxnResponse);
    if (sendTxnResponse.errorResultXdr) {
      // eslint-disable-next-line
      console.log(
        `ERROR: Cannot send transaction`,
        sendTxnResponse.errorResultXdr
      );
    }

    if (sendTxnResponse.status === 'PENDING') {
      // eslint-disable-next-line
      let txResponse = await sorobanServer.getTransaction(sendTxnResponse.hash);
      // let event = await sorobanServer.getEvents()
      while (txResponse.status === 'NOT_FOUND') {
        // eslint-disable-next-line
        txResponse = await sorobanServer.getTransaction(sendTxnResponse.hash);
        // eslint-disable-next-line
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      if (txResponse.status === 'SUCCESS') {
        console.log('txResponse', txResponse);
        handleTxnSuccessNotification(
          txResponse,
          successMsg,
          sendTxnResponse.hash
        );
        // turn off processing state when there's no more next steps
        if (cb) {
          cb(txResponse);
        } else {
          updateIsTxnProcessing(false);
        }
      }

      if (txResponse.status === 'FAILED') {
        // eslint-disable-next-line
        console.log(txResponse.status);
        updateIsTxnProcessing(false); // delay here and pass onto the next state controller
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
    networkPassphraseStr: string,
    contractName: ContractName | 'none'
  ) => {
    try {
      const preparedTxn = await sorobanServer.prepareTransaction(
        unpreparedTxn,
        networkPassphraseStr
      );
      return preparedTxn.toXDR();
    } catch (err) {
      handleErrors(
        'Cannot prepare transaction:',
        err,
        contractName === 'none' ? undefined : contractName
      );
      return null;
    }
  };

  const getTxnBuilder = async (
    publicKey: string
  ): Promise<SorobanClient.TransactionBuilder> => {
    const sourceAccount = await sorobanServer.getAccount(publicKey);
    return new SorobanClient.TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase:
        elioConfig?.networkPassphrase || NETWORK_PASSPHRASE[NETWORK],
    });
  };

  const signTxn = async (
    xdr: string,
    networkPassphraseStr: string,
    accountToSign: string
  ) => {
    const signedResponse = await signTransaction(xdr, {
      networkPassphrase: networkPassphraseStr,
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

  /** Use this to submit a transaction */
  const submitTxn = async (
    unpreparedTxn: SorobanClient.Transaction<
      SorobanClient.Memo<SorobanClient.MemoType>
    >,
    successMsg: string,
    errorMsg: string,
    contractName: ContractName | 'none', // add contract name for handle error code
    cb?: Function
  ) => {
    if (!elioConfig) {
      handleErrors('Cannot fetch contract addresses');
      return;
    }
    updateIsTxnProcessing(true);
    try {
      // eslint-disable-next-line
      console.log('Unprepared txn', unpreparedTxn.toXDR());
      const preparedTxn = await prepareTxn(
        unpreparedTxn,
        elioConfig.networkPassphrase,
        contractName
      );
      if (!preparedTxn) {
        return;
      }
      const signedTxn = await signTxn(
        preparedTxn,
        elioConfig.networkPassphrase,
        currentWalletAccount!.publicKey
      );
      const txResponse = await sendTxn(signedTxn, elioConfig.networkPassphrase);
      return await handleTxnResponse(txResponse, successMsg, errorMsg, cb);
    } catch (err) {
      handleErrors('Send Transaction failed', err);
      return null;
    }
  };

  /** Submit a transaction to read on-chain info */
  const submitReadTxn = async (
    txn: SorobanClient.Transaction<SorobanClient.Memo<SorobanClient.MemoType>>
  ) => {
    try {
      console.log('Stimulating transaction...');
      const res = await sorobanServer.simulateTransaction(txn);
      if (res.error) {
        // eslint-disable-next-line
        console.log('Cannot stimulate transaction', res.error)
      }
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
        networkPassphrase: elioConfig?.networkPassphrase,
      }
    )
      .addOperation(contract.call(method, ...params))
      .setTimeout(0)
      .build();

    return txn;
  };

  /**
   * Authenticate users access to post request
   */
  const doChallenge = async (daoId: string, publicKey: string) => {
    try {
      const challengeRes = await fetch(
        `${SERVICE_URL}/daos/${daoId}/challenge/`
      );
      const { challenge } = await challengeRes.json();

      if (!challenge) {
        handleErrors('Error in retrieving ownership-validation challenge');
        return null;
      }
      const signerResult = await signBlob(toBase64(challenge), {
        accountToSign: currentWalletAccount?.publicKey,
      });

      if (!signerResult) {
        handleErrors('Not able to validate ownership');
        return null;
      }

      return toBase64(signerResult);
    } catch (err) {
      handleErrors(err);
      return null;
    }
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
        'core',
        () => {
          setTimeout(() => {
            fetchDaoDB(createDaoData.daoId);
            updateIsStartModalOpen(false);
            updateIsTxnProcessing(false);
            router.push(`/dao/${createDaoData.daoId}/customize`);
          }, 3500);
        }
      );
    } catch (err) {
      handleErrors('Create Dao failed', err, 'core');
    }
  };

  // post dao metadata to the DB
  const postDaoMetadata = async (daoId: string, data: DaoMetadataValues) => {
    if (!currentWalletAccount) {
      return;
    }

    const sig = await doChallenge(daoId, currentWalletAccount.publicKey);
    if (!sig) {
      handleErrors('Cannot get valid signature for metadata post request');
      return;
    }
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
          Signature: sig,
        },
      }
    );

    const metadata = await metadataResponse.json();
    if (!metadata.metadata_url) {
      handleErrors('Not able to upload metadata');
    }
    return metadata;
  };

  const getDaoMetadata = async (daoId: string) => {
    if (!elioConfig || !currentWalletAccount?.publicKey) {
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
      handleErrors('getDaoMetadata failed', err, 'core');
      return null;
    }
  };

  /** Post metadata then set metadata onchain */
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
        'core',
        () => {
          setTimeout(() => {
            updateIsTxnProcessing(false);
            fetchDaoDB(daoId);
          }, 2000);
        }
      );
    } catch (err) {
      handleErrors('set DAO Metadata failed', err, 'core');
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
        'Destroy DAO Transaction Failed',
        'core'
      );
    } catch (err) {
      handleErrors('Destroy DAO Transaction Failed', err, 'core');
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
        numberToU32ScVal(config.proposalDuration),
        bigNumberToI128ScVal(
          config.minimumThreshold.multipliedBy(BigNumber(DAO_UNITS))
        ),
        accountToScVal(config.daoOwnerPublicKey)
      );
      await submitTxn(
        txn,
        'Governance has been set up successfully',
        'Governance setup failed',
        'votes',
        () => {
          setTimeout(() => {
            fetchDaoDB(config.daoId);
            updateIsTxnProcessing(false);
          }, 1000);
        }
      );
    } catch (err) {
      handleErrors('Setting governance configurations failed', err, 'votes');
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
        'Token contract creation failed',
        'core',
        () => {}
      );
    } catch (err) {
      handleErrors('Token contract creation failed', err, 'core');
    }
  };

  const mintToken = async (
    tokenAddress: string,
    supply: BigNumber,
    cb: Function
  ) => {
    updateIsTxnProcessing(true);
    try {
      const txn = await makeContractTxn(
        currentWalletAccount!.publicKey,
        tokenAddress,
        'mint',
        accountToScVal(currentWalletAccount!.publicKey),
        bigNumberToI128ScVal(supply.multipliedBy(BigNumber(DAO_UNITS)))
      );
      await submitTxn(
        txn,
        'Tokens minted successfully',
        'Token minting failed',
        'assets',
        cb
      );
    } catch (err) {
      handleErrors('Token minting failed', err, 'assets');
    }
  };

  const getAssetAddress = async (daoId: string) => {
    if (!elioConfig || !currentWalletAccount) {
      return;
    }
    try {
      const txn = await makeContractTxn(
        currentWalletAccount?.publicKey,
        elioConfig.coreContractAddress,
        'get_dao_asset_id',
        stringToScVal(daoId)
      );
      const tokenAddress = (await submitReadTxn(txn)) as string;
      return tokenAddress;
    } catch (err) {
      handleErrors('getAssetAddress failed', err, 'core');
      return null;
    }
  };

  const getDaoTokenBalance = async (daoId: string, targetPublicKey: string) => {
    if (!elioConfig || !isStellarPublicKey(targetPublicKey)) {
      return;
    }
    const tokenContractAddress = await getAssetAddress(daoId);
    if (!tokenContractAddress) {
      handleErrors('Cannot get token contract address');
      return;
    }
    try {
      const txn = await makeContractTxn(
        currentWalletAccount!.publicKey,
        tokenContractAddress,
        'balance',
        accountToScVal(targetPublicKey)
      );
      const val = await submitReadTxn(txn);
      return val;
    } catch (err) {
      handleErrors('getDaoTokenBalance failed', err, 'assets');
      return null;
    }
  };

  const issueTokenSetConfig = ({
    daoId,
    daoOwnerPublicKey,
    proposalDuration,
    minimumThreshold,
    tokenSupply,
  }: {
    daoId: string;
    tokenSupply: BigNumber;
  } & GovConfigValues) => {
    getAssetAddress(daoId)
      .then((tokenContractAddress) => {
        if (!tokenContractAddress) {
          createTokenContract(daoId, daoOwnerPublicKey)
            .then(() => {
              setTimeout(() => {
                getAssetAddress(daoId)
                  .then((tokenAddress) => {
                    if (!tokenAddress) {
                      handleErrors('Cannot get token address');
                      return;
                    }
                    mintToken(tokenAddress as string, tokenSupply, () => {
                      setTimeout(() => {
                        setGovernanceConfig({
                          daoId,
                          proposalDuration,
                          minimumThreshold,
                          daoOwnerPublicKey,
                        });
                      }, 3000);
                    });
                  })
                  .catch((err) => handleErrors('getAssetAddress failed', err));
              }, 6000);
            })
            .catch((err) =>
              handleErrors('createTokenContract failed', err, 'core')
            );
        } else {
          mintToken(tokenContractAddress as string, tokenSupply, () => {
            setTimeout(() => {
              setGovernanceConfig({
                daoId,
                proposalDuration,
                minimumThreshold,
                daoOwnerPublicKey,
              });
            }, 3000);
          }).catch((err) => handleErrors('mintToken failed', err, 'assets'));
        }
      })
      .catch((err) => handleErrors('getAssetAddress failed', err));
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
      handleErrors('getDao failed', err, 'core');
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
        'DAO owner change failed',
        'core'
      );
    } catch (err) {
      handleErrors('changeOwner failed', err, 'core');
    }
  };

  const getGovConfig = async (daoId: string) => {
    if (!currentWalletAccount?.publicKey || !elioConfig) {
      return;
    }
    try {
      const txn = await makeContractTxn(
        currentWalletAccount?.publicKey,
        elioConfig.votesContractAddress,
        'get_configuration',
        stringToScVal(daoId)
      );
      const val = await submitReadTxn(txn);
      return val;
    } catch (err) {
      handleErrors('getGovConfig failed', err, 'votes');
      return null;
    }
  };

  const createProposal = async (daoId: string, cb: Function) => {
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
        'Proposal creation failed',
        'votes',
        cb
      );
    } catch (err) {
      handleErrors('CreateProposal failed', err, 'votes');
    }
  };

  const setProposalMetadataOnChain = async (
    daoId: string,
    proposalId: number,
    metadataUrl: string,
    metadataHash: string
  ) => {
    const txn = await makeContractTxn(
      currentWalletAccount!.publicKey,
      elioConfig.votesContractAddress,
      'set_metadata',
      stringToScVal(daoId),
      numberToU32ScVal(proposalId),
      stringToScVal(metadataUrl),
      stringToScVal(metadataHash),
      accountToScVal(currentWalletAccount!.publicKey)
    );
    await submitTxn(
      txn,
      'Proposal metadata set on-chain successfully',
      'Proposal metadata set on-chain failed',
      'votes',
      () => {
        setTimeout(() => {
          fetchDaoDB(daoId);
          updateIsTxnProcessing(false);
          updateDaoPage('proposals');
          updateProposalCreationValues(null);
          router.push(`/dao/${daoId}`);
        }, 1500);
      }
    );
  };

  const postProposalMetadata = async (
    daoId: string,
    proposalId: number,
    proposalValues: ProposalCreationValues
  ) => {
    if (!elioConfig || !currentWalletAccount) {
      return;
    }
    updateIsTxnProcessing(true);
    try {
      const sig = await doChallenge(daoId, currentWalletAccount?.publicKey);
      if (!sig) {
        handleErrors('Cannot pass authentication challenge');
        return;
      }
      const jsonData = JSON.stringify({
        title: proposalValues?.title,
        description: proposalValues?.description,
        url: proposalValues?.url,
      });

      const metadataResponse = await fetch(
        `${SERVICE_URL}/proposals/${proposalId}/metadata/`,
        {
          method: 'POST',
          body: jsonData,
          headers: {
            'Content-Type': 'application/json',
            Signature: sig,
          },
        }
      );
      if (metadataResponse.status > 400) {
        handleErrors('Something is wrong with posting metadata');
      }
      const res = await metadataResponse.json();
      const metadata = {
        metadataHash: res?.metadata_hash?.toString(),
        metadataUrl: res?.metadata_url?.toString(),
      };
      if (!metadata?.metadataUrl) {
        handleErrors(`Not able to upload metadata Status:${res?.status}`);
        return null;
      }
      return metadata;
    } catch (err) {
      handleErrors('postProposalMetadata failed', err);
      return null;
    }
  };

  const vote = async (
    daoId: string,
    proposalId: number,
    inFavor: boolean,
    cb: Function
  ) => {
    if (!elioConfig) {
      return;
    }
    updateIsTxnProcessing(true);
    try {
      const txn = await makeContractTxn(
        currentWalletAccount!.publicKey,
        elioConfig.votesContractAddress,
        'vote',
        stringToScVal(daoId),
        numberToU32ScVal(proposalId),
        booleanToScVal(inFavor),
        accountToScVal(currentWalletAccount!.publicKey)
      );
      await submitTxn(txn, 'Voted successfully', 'Voting failed', 'votes', cb);
    } catch (err) {
      handleErrors('vote failed', err);
    }
  };

  const transferDaoTokens = async (
    daoId: string,
    toPublicKeys: string[],
    amount: BigNumber[]
  ) => {
    if (!currentWalletAccount) {
      return;
    }
    const tokenContractAddress = await getAssetAddress(daoId);
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
          bigNumberToI128ScVal(amount[i]!)
        )
      );
    });
    const txn = txnBuilder.setTimeout(0).build();
    await submitTxn(
      txn,
      'Transferred successfully',
      'Transfer failed',
      'assets'
    );
  };

  const finalizeProposal = async (
    daoId: string,
    proposalId: number,
    cb: Function
  ) => {
    if (!elioConfig) {
      return;
    }
    try {
      const txn = await makeContractTxn(
        currentWalletAccount!.publicKey,
        elioConfig.votesContractAddress,
        'finalize_proposal',
        stringToScVal(daoId),
        numberToU32ScVal(proposalId)
      );
      await submitTxn(
        txn,
        'Proposal Finalized successfully',
        'Proposal Finalizing failed',
        'votes',
        cb
      );
    } catch (err) {
      handleErrors('Finalize Proposal failed', err, 'votes');
    }
  };

  const reportFaultyProposal = async (
    daoId: string,
    publicKey: string,
    proposalId: string,
    reason: string
  ) => {
    updateIsTxnProcessing(true);

    try {
      const jsonData = JSON.stringify({
        proposal_id: proposalId,
        reason,
      });
      const sig = await doChallenge(daoId, publicKey);
      if (!sig) {
        handleErrors('Verification Challenge failed');
        return;
      }

      const faultyProposalResponse = await fetch(
        `${SERVICE_URL}/proposals/${proposalId}/report-faulted/`,
        {
          method: 'POST',
          body: jsonData,
          headers: {
            'Content-Type': 'application/json',
            Signature: sig,
          },
        }
      );

      const res = await faultyProposalResponse.json();
      if (res?.reason?.detail?.includes('report maximum has already been')) {
        handleErrors(res.reason.detail);
      }

      if (!res?.reason) {
        handleErrors(`Not able to report faulty proposal: ${res?.detail}`);
        return;
      }
      updateIsFaultyModalOpen(false);
      updateIsTxnProcessing(false);
      const successNoti = {
        title: `${TxnResponse.Success}`,
        message: 'Your faulty proposal report has been submitted. Thank you!',
        type: TxnResponse.Success,
        timestamp: Date.now(),
      };
      addTxnNotification(successNoti);
    } catch (err) {
      handleErrors(err);
      updateIsFaultyModalOpen(false);
      updateIsTxnProcessing(false);
      const errNoti = {
        title: `${TxnResponse.Error}`,
        message: 'There was an issue submitted the report. Please try again. ',
        type: TxnResponse.Error,
        timestamp: Date.now(),
      };
      addTxnNotification(errNoti);
    }
  };

  const makeInstallMulticliqueTxns = async (policyData: {
    source: string;
    policy: 'ELIO_DAO';
  }) => {
    try {
      const response = await fetch(
        'https://service.elio-dao.org/multiclique/accounts/install',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(policyData),
        }
      );
      const data = await response.json();
      const { core_xdr } = data;
      const { policy_xdr } = data;
      return {
        coreTransaction: new SorobanClient.Transaction(
          core_xdr,
          elioConfig.networkPassphrase
        ),
        policyTransaction: new SorobanClient.Transaction(
          policy_xdr,
          elioConfig.networkPassphrase
        ),
      };
    } catch (err) {
      handleErrors('Error in installing Multiclique policy', err);
      return null;
    }
  };

  const getMulticliqueAddresses = async (policyData: {
    source: string;
    policy: 'ELIO_DAO';
  }) => {
    const txns = await makeInstallMulticliqueTxns(policyData);

    if (!txns) {
      return;
    }

    const coreResult = await submitTxn(
      txns.coreTransaction,
      'Multiclique core contract installed',
      'Error in Multiclique core contract installation',
      'multicliqueCore'
    );

    if (!coreResult?.resultMetaXdr) {
      throw new Error('Cannot get multiclique core address');
    }

    const policyResult = await submitTxn(
      txns.policyTransaction,
      'Multiclique policy contract installed',
      'Error in Multiclique policy installation',
      'multicliquePolicy'
    );

    if (!policyResult?.resultMetaXdr) {
      throw new Error('Cannot get multiclique policy address');
    }

    return {
      coreAddress: SorobanClient.xdr.TransactionMeta.fromXDR(
        coreResult.resultMetaXdr,
        'base64'
      )
        .v3()
        ?.sorobanMeta()
        ?.returnValue()
        .address()
        .contractId(),
      policyAddress: SorobanClient.xdr.TransactionMeta.fromXDR(
        policyResult.resultMetaXdr,
        'base64'
      )
        .v3()
        ?.sorobanMeta()
        ?.returnValue()
        .address()
        .contractId(),
    };
  };

  const initMulticliqueCore = async (
    coreContractAddy: string,
    signerAddresses: string[],
    threshold: number
  ) => {
    if (!currentWalletAccount) {
      return;
    }

    const rawKeys = signerAddresses.map((addy) => {
      return SorobanClient.Keypair.fromPublicKey(addy).rawPublicKey();
    });
    const coreContract = new SorobanClient.Contract(coreContractAddy);
    const txnBuilder = await getTxnBuilder(currentWalletAccount?.publicKey);
    const txn = txnBuilder
      .addOperation(
        // An operation to call increment on the contract
        coreContract.call(
          'init',
          SorobanClient.nativeToScVal(rawKeys),
          numberToU32ScVal(threshold)
        )
      )
      .setTimeout(0)
      .build();

    const res = await submitTxn(
      txn,
      'Initialized Multiclique ',
      'Error in initializing Multiclique',
      'multicliqueCore'
    );
    console.log(res);
  };

  return {
    getTxnBuilder,
    getDaoMetadata,
    getDao,
    getAssetAddress,
    createTokenContract,
    makeContractTxn,
    createDao,
    doChallenge,
    setDaoMetadata,
    destroyDao,
    issueTokenSetConfig,
    changeOwner,
    createProposal,
    postProposalMetadata,
    vote,
    transferDaoTokens,
    getDaoTokenBalance,
    getGovConfig,
    setProposalMetadataOnChain,
    finalizeProposal,
    reportFaultyProposal,
    getMulticliqueAddresses,
    initMulticliqueCore,
  };
};

export default useElioDao;
