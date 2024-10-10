import React from "react";
import type { AppProps } from "next/app";
import { appWithTranslation } from 'next-i18next'
import Layout from "@/components/Layout";
import { getStaticPaths, makeStaticProperties } from '../lib/get-static'

import "../styles/globals.css";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Layout {...pageProps}>
      <Component {...pageProps} />
    </Layout>
  );
}

export default appWithTranslation(MyApp);

export const getStaticProps = makeStaticProperties(['common'])

export { getStaticPaths }