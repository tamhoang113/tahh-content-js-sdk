import { getClient, isContentTypeRegistered } from '@optimizely/cms-sdk';
import { OptimizelyComponent } from '@optimizely/cms-sdk/react/server';
import { notFound } from 'next/navigation';
import React from 'react';

export const dynamicParams = true;

export async function generateStaticParams() {
  if (!process.env.APPLICATION_HOST) {
    return [];
  }

  const query = `
  query GetPosts {
    _Page(limit: 100) {
      items {
        _metadata {
          types
          url {
            base
            default
          }
        }
      }
    }
  }
  `;

  const client = getClient();
  const data = await client.request(query, {});

  return data._Page.items
    .filter((item: any) => {
      if (item?._metadata?.url?.base !== process.env.APPLICATION_HOST) return false;
      const contentType = item?._metadata?.types?.[0];
      return contentType && isContentTypeRegistered(contentType);
    })
    .map((item: any) => item?._metadata?.url?.default)
    .filter((path?: string) => typeof path === 'string')
    .map((path: string) => path.replace(/^\/|\/$/g, ''))
    .filter((path: string) => path !== '')
    .map((path: string) => ({ slug: path.split('/') }));
}

type Props = {
  params: Promise<{ slug: string[] }>;
};

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const client = getClient();
  const content = await client.getContentByPath(`/${slug.join('/')}/`);

  if (content.length === 0) {
    notFound();
  }

  return <OptimizelyComponent content={content[0]} />;
}
