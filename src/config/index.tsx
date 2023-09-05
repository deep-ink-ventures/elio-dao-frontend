import BigNumber from 'bignumber.js';

enum Network {
  Futurenet = 'FUTURENET',
  Standalone = 'STANDALONE',
  Pubnet = 'PUBNET',
}

/**
 * Do you want to get configuration values from Elio service?
 */
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

/** In XLM */
export const BASE_FEE: string = '100';

export const CORE_CONTRACT_ADDRESS: string =
  'CARLLI6NGVTOIF4FCL24YR6L77YXB5IRGLTKKRHDFATKRUKPRCXHPVUX';

export const VOTES_CONTRACT_ADDRESS: string =
  'CDNM7K27N36QNGGXX7V4IANTHRHSL5SHZZWSBTJTEZEYWUIDVAB7I4YU';

export const ASSETS_WASM_HASH: string =
  'd3eb9fc0e186fc7b761ea4be7b6b195dd6b39f55b843b2369ee39163288a502b';

export const MULTICLIQUE_CONTRACT_ADDRESS: string =
  'CCZCZIFWN4RKIFGMPEZKTPYECRC2YWKKG2MGI27YJIXDTX7LSNSBYVU2';

export const MULTICLIQUE_ELIO_PRESET_ADDRESS: string =
  'CDZDS2VL6GHY6XUVIFL35EUWXPBFC4UIWKSPZ6CUQ4AZBOB7VYYAVR3Q';

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
