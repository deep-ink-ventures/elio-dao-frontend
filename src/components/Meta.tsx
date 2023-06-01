import { NextSeo } from 'next-seo';
import Head from 'next/head';

type IMetaProps = {
  title: string;
  description: string;
  canonical?: string;
  siteName?: string;
};

const Meta = (props: IMetaProps) => {
  return (
    <>
      <Head>
        <meta charSet='UTF-8' key='charset' />
        <meta
          name='viewport'
          content='width=device-width,initial-scale=1'
          key='viewport'
        />
      </Head>
      <NextSeo
        title={props.title}
        description={props.description}
        canonical={props.canonical}
        openGraph={{
          title: props.title,
          description: props.description,
          url: props.canonical,
          site_name: props.siteName ? props.siteName : 'elio DAO',
        }}
      />
    </>
  );
};

export default Meta;
