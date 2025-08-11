import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      // Forward the form-data to the Python FastAPI backend for video analysis
      const formData = await req.formData();
      const video = formData.get('video');
      const prompt = formData.get('prompt') || 'Describe this video.';
      if (!video || typeof video === 'string') {
        return NextResponse.json({ error: 'No video file provided.' }, { status: 400 });
      }
      const backendForm = new FormData();
      backendForm.append('video', video as Blob);
      if (prompt) backendForm.append('prompt', prompt as string);
      const response = await fetch('http://localhost:8000/analyze-video', {
        method: 'POST',
        body: backendForm,
      });
      let data;
      if (!response.ok) {
        let errorText = await response.text();
        try {
          data = JSON.parse(errorText);
        } catch {
          data = { error: errorText || 'Unknown error from backend' };
        }
        console.error('FastAPI backend error:', data.error, 'Status:', response.status);
        return NextResponse.json({ error: data.error || 'Failed to process video', status: response.status }, { status: response.status });
      }
      data = await response.json();
      return NextResponse.json(data);
    } else {
      // Text or image+prompt for vision-language model (Qwen2.5-VL 7B)
      const contentTypeJson = contentType.includes('application/json');
      if (contentTypeJson) {
        const { message, image } = await req.json();
        // Forward to Ollama backend (supports Qwen2.5-VL 7B)
        const response = await fetch('http://localhost:3001/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: message, image }),
        });
        const data = await response.json();
        return NextResponse.json(data);
      } else {
        return NextResponse.json({ error: 'Unsupported content type.' }, { status: 400 });
      }
    }
  } catch (error: any) {
    console.error('API route error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to connect to backend' }, { status: 500 });
  }
}
