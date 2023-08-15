import { SERVICE_URL } from '@/config';
import BigNumber from 'bignumber.js';
import { AssetsHoldingsService } from './assets';

export interface Dao {
  id: string;
  name: string;
  creator_id: string;
  owner_id: string;
  asset_id: number;
  proposal_duration: number;
  proposal_token_deposit: number;
  minimum_majority_per_1024: number;
  setup_complete: boolean;
  metadata_url: string;
  metadata_hash: string;
  metadata?: Metadata;
}

export interface Metadata {
  email?: string;
  images?: Images;
  description_long?: string;
  description_short?: string;
}

export interface Images {
  logo?: Logo;
}

export interface Logo {
  large: Image;
  small: Image;
  medium: Image;
  content_type?: string;
}

export interface Image {
  url?: string;
}

const get = async (daoId: string) => {
  const response = await fetch(`${SERVICE_URL}/daos/${daoId}`);

  const objResponse = await response.json();

  return objResponse as Dao;
};

const getBalance = async (daoId: string, accountId: string) => {
  const dao = await get(daoId);

  if (dao.asset_id) {
    const response = await AssetsHoldingsService.listAssetHoldings({
      asset_id: dao?.asset_id?.toString(),
      owner_id: accountId,
    });

    const daoTokenBalance = new BigNumber(response?.results?.[0]?.balance || 0);
    return daoTokenBalance;
  }

  return null;
};

export const DaoService = {
  get,
  getBalance,
};
