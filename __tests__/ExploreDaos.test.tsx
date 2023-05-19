import { render, screen } from '@testing-library/react';

import ExploreDaos from '@/components/ExploreDaos';
// // eslint-disable-next-line
// jest.mock('next/router', () => require('next-router-mock'));

// // eslint-disable-next-line
// jest.mock('next/router', () => ({
//   useRouter: jest.fn(),
// }));

// beforeEach(() => {
//   jest.spyOn(global, 'fetch').mockResolvedValue({
//     json: jest.fn().mockResolvedValue({}),
//   } as any);
// });

describe('Explore Daos', () => {
  test('should render Explore text', () => {
    render(<ExploreDaos />);
    const texts = screen.getAllByText(/Explore/);
    expect(texts[0]).toBeInTheDocument();
  });
});

// afterEach(() => {
//   jest.restoreAllMocks();
// });
