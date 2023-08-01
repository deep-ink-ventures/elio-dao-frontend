enum Network {
  Futurenet = 'FUTURENET',
  Standalone = 'STANDALONE',
  Pubnet = 'PUBNET',
}

// do you want to get config from service
export const getConfigFromService: boolean = true;
/**
 * Use this to change network
 */
export const NETWORK: Network = Network.Futurenet;
/** 18 decimals */
export const DAO_UNITS: Readonly<number> = 1000000000000000000;
/** Block time in seconds */
export const BLOCK_TIME: Readonly<number> = 5;
/** 7 decimals */
export const XLM_UNITS: Readonly<number> = 10000000;
export const BASE_FEE: Readonly<string> = '100';

export const NETWORK_PASSPHRASE: Readonly<{ [key in Network]: string }> = {
  FUTURENET: 'Test SDF Future Network ; October 2022',
  STANDALONE: 'Standalone Network ; February 2017',
  PUBNET: 'Public Global Stellar Network ; September 2015',
};

export const SOROBAN_RPC_ENDPOINT: Readonly<{ [key in Network]: string }> = {
  FUTURENET: 'https://horizon-futurenet.stellar.org',
  STANDALONE: 'https://node.elio-dao.org/soroban/rpc',
  PUBNET: 'https://horizon.stellar.org',
};
export const SERVICE_URL: Readonly<string> = 'https://service.elio-dao.org';
