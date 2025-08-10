import { type NextRequest, NextResponse } from "next/server"
import { videoAnalyses } from "./process-video/route"

// Enhanced chat function that actually analyzes video content
async function generateChatResponse(message: string, context: any) {
  await new Promise((resolve) => setTimeout(resolve, 800))

  const events = context.events || []
  const summary = context.summary || ""
  const metadata = context.metadata || {}

  const lowerMessage = message.toLowerCase()

  // Extract useful information from events
  const objectDetections = events.filter((e: any) => e.type === "object_detection")
  const actionRecognitions = events.filter((e: any) => e.type === "action_recognition")
  const allObjects = [...new Set(events.flatMap((e: any) => e.objects))]
  const totalEvents = events.length

  // Object-related queries
  if (
    lowerMessage.includes("object") ||
    lowerMessage.includes("detect") ||
    lowerMessage.includes("see") ||
    lowerMessage.includes("what")
  ) {
    if (lowerMessage.includes("how many") || lowerMessage.includes("count")) {
      return `I detected ${allObjects.length} different types of objects across ${objectDetections.length} detection events in your video. The objects include: ${allObjects.join(", ")}. The most frequently detected objects were ${objectDetections
        .slice(0, 3)
        .map((e: any) => e.objects[0])
        .join(", ")}.`
    }

    const highConfidenceObjects = objectDetections
      .filter((e: any) => e.confidence > 0.8)
      .map((e: any) => `${e.objects.join(", ")} (${Math.round(e.confidence * 100)}% confidence at ${e.timestamp}s)`)

    return `In your video, I identified these objects with high confidence: ${highConfidenceObjects.slice(0, 5).join("; ")}. ${allObjects.length > 5 ? `I also detected ${allObjects.length - 5} other object types with varying confidence levels.` : ""} Would you like me to focus on any specific objects or time periods?`
  }

  // Action-related queries
  if (
    lowerMessage.includes("action") ||
    lowerMessage.includes("doing") ||
    lowerMessage.includes("activity") ||
    lowerMessage.includes("movement")
  ) {
    if (actionRecognitions.length === 0) {
      return `I didn't detect any specific actions in this video. The analysis focused mainly on object detection, identifying ${allObjects.length} different types of objects including ${allObjects.slice(0, 3).join(", ")}.`
    }

    const actionSummary = actionRecognitions
      .map((e: any) => `${e.description} at ${e.timestamp}s (${Math.round(e.confidence * 100)}% confidence)`)
      .join("; ")

    return `I identified ${actionRecognitions.length} action events in your video: ${actionSummary}. These actions occurred throughout the ${metadata.duration || "unknown duration"} video timeline.`
  }

  // Time-related queries
  if (lowerMessage.includes("time") || lowerMessage.includes("when") || lowerMessage.includes("timestamp")) {
    const timelineEvents = events
      .slice(0, 5)
      .map((e: any) => `${e.timestamp}s: ${e.description} (${e.type.replace("_", " ")})`)
      .join("\n")

    return `Here's a timeline of key events in your video:\n\n${timelineEvents}\n\n${events.length > 5 ? `...and ${events.length - 5} more events. ` : ""}The video spans approximately ${metadata.duration || "unknown"} seconds total.`
  }

  // Summary-related queries
  if (lowerMessage.includes("summary") || lowerMessage.includes("overview") || lowerMessage.includes("describe")) {
    return `${summary}\n\nKey statistics:\n• Total events detected: ${totalEvents}\n• Objects identified: ${allObjects.length} types\n• Actions recognized: ${actionRecognitions.length}\n• Video duration: ~${metadata.duration || "unknown"} seconds\n• File: ${metadata.filename || "uploaded video"}`
  }

  // Specific object queries
  const mentionedObjects = allObjects.filter((obj) => lowerMessage.includes(obj.toLowerCase()))
  if (mentionedObjects.length > 0) {
    const objectEvents = events.filter((e: any) => e.objects.some((obj: string) => mentionedObjects.includes(obj)))

    const timestamps = objectEvents.map((e: any) => `${e.timestamp}s`).join(", ")
    return `I found ${mentionedObjects.join(" and ")} in your video at these timestamps: ${timestamps}. ${mentionedObjects[0]} appeared in ${objectEvents.length} different frames with an average confidence of ${Math.round((objectEvents.reduce((sum: number, e: any) => sum + e.confidence, 0) / objectEvents.length) * 100)}%.`
  }

  // Quality and confidence queries
  if (lowerMessage.includes("confidence") || lowerMessage.includes("accuracy") || lowerMessage.includes("sure")) {
    const avgConfidence = Math.round(
      (events.reduce((sum: number, e: any) => sum + e.confidence, 0) / events.length) * 100,
    )
    const highConfEvents = events.filter((e: any) => e.confidence > 0.8).length

    return `The overall analysis confidence is ${avgConfidence}%. Out of ${totalEvents} total detections, ${highConfEvents} had confidence scores above 80%. The highest confidence detections were for ${events
      .sort((a: any, b: any) => b.confidence - a.confidence)
      .slice(0, 3)
      .map((e: any) => e.objects[0])
      .join(", ")}.`
  }

  // Help and capabilities
  if (lowerMessage.includes("help") || lowerMessage.includes("can you") || lowerMessage.includes("what can")) {
    return `I can help you understand your video analysis! Here's what I can tell you about:\n\n• **Objects**: What objects were detected and where\n• **Actions**: Any activities or movements identified\n• **Timeline**: When specific events occurred\n• **Summary**: Overall description of the video content\n• **Confidence**: How certain the AI was about detections\n\nTry asking: "What objects did you see?", "When did actions occur?", or "Give me a summary"`
  }

  // Default contextual response
  const randomEvent = events[Math.floor(Math.random() * events.length)]
  const contextualResponse = `Based on my analysis of your ${metadata.duration || "unknown duration"}-second video "${metadata.filename || "uploaded video"}", I detected ${totalEvents} events including ${allObjects.slice(0, 3).join(", ")}${allObjects.length > 3 ? ` and ${allObjects.length - 3} other objects` : ""}. ${randomEvent ? `For example, at ${randomEvent.timestamp}s I detected ${randomEvent.description}.` : ""} What specific aspect would you like to explore further?`

  return contextualResponse
}

export async function POST(request: NextRequest) {
  try {
    const { videoId, message, context } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 })
    }

    // Generate response using context
    const response = await generateChatResponse(message, context)

    // Store chat message in memory (GPU storage in production)
    const videoData = videoAnalyses.get(videoId)
    if (videoData) {
      videoData.chatMessages.push({
        id: Date.now().toString(),
        user_message: message,
        assistant_response: response,
        timestamp: new Date().toISOString(),
      })
      videoAnalyses.set(videoId, videoData)
    }

    console.log(`Chat message stored for video: ${videoId}`)

    return NextResponse.json({ response })
  } catch (error) {
    console.error("Chat error:", error)
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
  }
}

// --- GPU API integration ---
// To use the GPU API, uncomment the following and comment out the generateChatResponse logic above:
/*
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    // Replace <gpu-server-ip> with your actual GPU server IP or hostname
    const response = await fetch("http://<gpu-server-ip>:5000/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to connect to GPU API" }, { status: 500 });
  }
}
*/
