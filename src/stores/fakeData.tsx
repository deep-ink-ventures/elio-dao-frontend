import type { DaoDetail } from './elioStore';

export const daoArray: DaoDetail[] = [
  {
    daoId: '1',
    daoName: 'Example DAO 1',
    daoOwnerAddress: 'GCDTNDOCT2CWJVHGOKADQ7IEUPHQTPCHPDYKITMUGZAMAOBQ36VPO22V',
    daoCreatorAddress:
      'GCDTNDOCT2CWJVHGOKADQ7IEUPHQTPCHPDYKITMUGZAMAOBQ36VPO22V',
    setupComplete: true,
    daoAssetId: 1,
    metadataUrl: null,
    metadataHash: null,
    descriptionShort: 'Short description of Example DAO 1',
    descriptionLong: 'Longer description of Example DAO 1',
    email: 'exampledao1@example.com',
    images: {
      contentType: 'image/png',
      small: 'https://i.imgur.com/DIkQsjq.png',
      medium: 'https://i.imgur.com/DIkQsjq.png',
      large: 'https://i.imgur.com/DIkQsjq.png',
    },
  },
  {
    daoId: '2',
    daoName: 'Example DAO 2',
    daoOwnerAddress: 'GCDTNDOCT2CWJVHGOKADQ7IEUPHQTPCHPDYKITMUGZAMAOBQ36VPO22V',
    daoCreatorAddress:
      'GCDTNDOCT2CWJVHGOKADQ7IEUPHQTPCHPDYKITMUGZAMAOBQ36VPO22V',
    setupComplete: true,
    daoAssetId: 2,
    metadataUrl: 'https://example.com/metadata',
    metadataHash: 'abcdefg',
    descriptionShort: 'Short description of Example DAO 2',
    descriptionLong: 'Longer description of Example DAO 2',
    email: 'fake@gmail.com',
    images: {
      contentType: 'image/png',
      small: 'https://i.imgur.com/DIkQsjq.png',
      medium: 'https://i.imgur.com/DIkQsjq.png',
      large: 'https://i.imgur.com/DIkQsjq.png',
    },
  },
  {
    daoId: '3',
    daoName: 'Example DAO 3',
    daoOwnerAddress: 'GCDTNDOCT2CWJVHGOKADQ7IEUPHQTPCHPDYKITMUGZAMAOBQ36VPO22V',
    daoCreatorAddress:
      'GCDTNDOCT2CWJVHGOKADQ7IEUPHQTPCHPDYKITMUGZAMAOBQ36VPO22V',
    setupComplete: true,
    daoAssetId: 3,
    metadataUrl: null,
    metadataHash: null,
    descriptionShort: 'Short description of Example DAO 3',
    descriptionLong: 'Longer description of Example DAO 3',
    email: 'exampledao3@example.com',
    images: {
      contentType: 'image/jpeg',
      small: 'https://i.imgur.com/DIkQsjq.png',
      medium: 'https://i.imgur.com/DIkQsjq.png',
      large: 'https://i.imgur.com/DIkQsjq.png',
    },
  },
];