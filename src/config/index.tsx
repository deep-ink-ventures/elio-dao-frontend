import BigNumber from 'bignumber.js';

enum Network {
  Futurenet = 'FUTURENET',
  Standalone = 'STANDALONE',
  Pubnet = 'PUBNET',
}

// do you want to get config from Elio service?
export const isConfigFromService: boolean = true;

/**
 * Use this to change network
 */
export const NETWORK: Network = Network.Futurenet;

/** 7 decimals */
export const XLM_UNITS: BigNumber = BigNumber(10000000);

/** 1000 XLM + 7 decimals */
export const DAO_CREATION_DEPOSIT_XLM: BigNumber =
  BigNumber(1000).multipliedBy(XLM_UNITS);

/** 100 XLM + 7 decimals */
export const PROPOSAL_CREATION_DEPOSIT_XLM: BigNumber =
  BigNumber(100).multipliedBy(XLM_UNITS);

/** 18 decimals */
export const DAO_UNITS: BigNumber = BigNumber(1000000000000000000);

/** Block time in seconds */
export const BLOCK_TIME: number = 5;

export const BASE_FEE: string = '100';

export const CORE_CONTRACT_ADDRESS: string =
  'CADWPDMQEQZ3E4VYLWNQV6BE24OEFIG2WTHOC7BCKWO4XVP7Z4GX3BAA';

export const VOTES_CONTRACT_ADDRESS: string =
  'CDIH6JS3L4BB2FHMJDNG4EKJIHNUWLYTLWRBPG6L427JM3N7NXWF3LIT';

export const ASSETS_WASM_HASH: string =
  '00a8269a3d787b841110ea4156d7ddab3343b307743b05c0dd8e934e06c42afc';

export const NETWORK_PASSPHRASE: { [key in Network]: string } = {
  FUTURENET: 'Test SDF Future Network ; October 2022',
  STANDALONE: 'Standalone Network ; February 2017',
  PUBNET: 'Public Global Stellar Network ; September 2015',
};

export const SOROBAN_RPC_ENDPOINT: { [key in Network]: string } = {
  FUTURENET: 'https://rpc-futurenet.stellar.org',
  STANDALONE: 'https://node.elio-dao.org/soroban/rpc',
  PUBNET: 'https://horizon.stellar.org',
};
export const SERVICE_URL: Readonly<string> = 'https://service.elio-dao.org';
