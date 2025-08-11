import { NextResponse } from "next/server"

// REMOVE all mock/contextual video analysis logic and forward all chat requests to the Ollama backend
export async function POST(req: Request) {
  try {
    // Check if this is a video upload (multipart/form-data)
    const contentType = req.headers.get("content-type") || ""
    if (contentType.includes("multipart/form-data")) {
      // Forward the form-data to the Ollama video backend
      const formData = await req.formData()
      const video = formData.get("video")
      const prompt = formData.get("prompt") || "Describe this video."
      const backendForm = new FormData()
      if (video && typeof video !== "string") backendForm.append("video", video as Blob)
      if (prompt) backendForm.append("prompt", prompt as string)
      const response = await fetch("http://localhost:3001/generate-video", {
        method: "POST",
        body: backendForm,
      })
      const data = await response.json()
      return NextResponse.json(data)
    } else {
      // Text prompt (JSON)
      const { message } = await req.json()
      const response = await fetch("http://localhost:3001/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: message }),
      })
      const data = await response.json()
      return NextResponse.json(data)
    }
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to connect to Ollama backend" }, { status: 500 })
  }
}
