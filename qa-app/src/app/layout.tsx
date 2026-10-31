import React from 'react';
import './globals.css';
import { config, initContentTypeRegistry } from '@optimizely/cms-sdk';
import { initReactComponentRegistry } from '@optimizely/cms-sdk/react/server';
import { QA_CONTENT_TYPES, QA_RESOLVERS } from '@/components/_registry';

config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY || '',
  graphUrl: process.env.OPTIMIZELY_GRAPH_GATEWAY,
  fragment: {
    richTextFormat: 'both',
    expandContracts: true,
  },
  query: {
    resolveTaxonomy: true,
  },
});

initContentTypeRegistry(QA_CONTENT_TYPES);

initReactComponentRegistry({
  resolver: QA_RESOLVERS,
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body>{children}</body>
    </html>
  );
}
