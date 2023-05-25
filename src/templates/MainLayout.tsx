import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

import Meta from '@/components/Meta';
import WalletConnect from '@/components/WalletConnect';
import logo from '@/svg/logo.svg';

interface IMainProps {
  title: string;
  description: string;
  canonical?: string;
  siteName?: string;
  children: ReactNode;
}

/**
 *
 * @param meta
 * @param children
 * @returns
 */
const MainLayout = (props: IMainProps) => (
  <div className='m-auto max-w-screen-xl px-1'>
    <Meta
      title={props.title}
      description={props.description}
      canonical={props.canonical ? props.canonical : ''}
      siteName={props.siteName ? props.siteName : 'elio DAO'}
    />
    <div className='mx-auto'>
      <div>
        <div className='header'></div>
        <div className='flex flex-wrap justify-between px-6'>
          <div className='flex justify-center align-middle'>
            <div className='flex items-center justify-center align-middle'>
              <Link href='/'>
                <Image src={logo} width={130} height={80} alt='elioDAO logo' />
              </Link>
            </div>
          </div>
          <div className='py-2'>
            <WalletConnect text='Connect' />
          </div>
        </div>
        <div className='m-2 min-h-screen rounded-2xl border-slate-800 p-2'>
          {props.children}
        </div>
      </div>
      <div
        className={`absolute left-[18%] top-[-15px] z-[-100] mx-auto hidden h-[60%] w-[64%] bg-[url('../../public/images/background-texture.png')] mix-blend-screen md:block`}></div>
      <div className='blur0'></div>
      <div className='blur1'></div>
    </div>
  </div>
);

export default MainLayout;
