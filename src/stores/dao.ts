/* eslint-disable no-param-reassign */
import { produce } from 'immer';
import type { StateCreator } from 'zustand';

import type {
  ListProposalsQueryParams,
  ProposalDetail,
} from '@/services/proposals';
import { ProposalsService } from '@/services/proposals';

import type { ElioState } from './elioStore';

export type DaoSlice = {
  transactions: {
    loading: boolean;
    data: Array<ProposalDetail>;
    totalCount?: number;
    fetchTransactions: (params?: ListProposalsQueryParams) => Promise<void>;
  };
};

export const createDaoSlice: StateCreator<
  ElioState,
  [],
  [],
  { dao: DaoSlice }
> = (set) => ({
  dao: {
    transactions: {
      loading: false,
      data: [],
      fetchTransactions: async (params) => {
        set(
          produce((state: ElioState) => {
            state.pages.dao.transactions.loading = true;
          })
        );
        const response = await ProposalsService.listProposals(params);
        set(
          produce((state: ElioState) => {
            state.pages.dao.transactions.data = response.mappedData;
            state.pages.dao.transactions.loading = false;
            state.pages.dao.transactions.totalCount = response.data.count;
          })
        );
      },
    },
  },
});
