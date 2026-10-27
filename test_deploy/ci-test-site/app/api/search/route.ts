import { NextResponse } from 'next/server';
import { getAllSearchableContent } from '../../../lib/search';
import { initialize } from '../../../lib/initialization';

initialize();

export const revalidate = 60;

export async function GET() {
  try {
    const content = await getAllSearchableContent();

    return NextResponse.json({
      success: true,
      data: content,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Search API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch searchable content',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

