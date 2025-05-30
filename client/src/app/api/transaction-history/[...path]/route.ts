import { NextRequest, NextResponse } from 'next/server';

// https://www.helius.dev/docs
// https://nextjs.org/docs
// server-side proxy was created with assistnace from Claude for debugging and testing

export async function GET( request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path || [];
  const apiUrl = process.env.API_URL || 'http://localhost:3001';
  
  // Construct path from the path array - Line 11
  const subPath = path.join('/');
  
  // Get URL object to extract search params
  const { searchParams } = new URL(request.url);
  
  // Build the URL to forward to
  const url = `${apiUrl}/api/transaction-history/${subPath}?${searchParams}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
      const data = await response.json();
    
    return NextResponse.json(data, {
      status: response.status,
    });

  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from API' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path || [];
  const apiUrl = process.env.API_URL || 'http://localhost:3001';
  const subPath = path.join('/');
  const { searchParams } = new URL(request.url);
  const url = `${apiUrl}/api/transaction-history/${subPath}?${searchParams}`;
  
  try {
    const body = await request.json();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json({ error: 'Failed to fetch data from API' }, { status: 500 });
  }
}

