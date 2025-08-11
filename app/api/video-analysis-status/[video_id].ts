import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: { video_id: string } }) {
  const { video_id } = params;
  // Forward the polling request to the FastAPI backend
  const response = await fetch(`http://localhost:8000/video-analysis-status/${video_id}`);
  const data = await response.json();
  return NextResponse.json(data);
}
