"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Video, Activity, Zap, Brain, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { VideoUpload } from "@/components/video-upload"
import { ChatInterface } from "@/components/chat-interface"
import { EventTimeline } from "@/components/event-timeline"
import { ProcessingStatus } from "@/components/processing-status"
import { useToast } from "@/hooks/use-toast"

interface ProcessingResult {
  id: string
  video_url: string
  events: Array<{
    timestamp: number
    type: string
    description: string
    confidence: number
    objects: string[]
  }>
  summary: string
  captions: Array<{
    timestamp: number
    caption: string
  }>
}

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState<"upload" | "processing" | "results">("upload")
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  const handleVideoUpload = useCallback(
    async (file: File) => {
      // Prevent multiple simultaneous uploads
      if (isProcessing) return

      setIsProcessing(true)
      setCurrentStep("processing")

      try {
        const formData = new FormData()
        formData.append("video", file)
        formData.append("prompt", "Describe this video.")

        // Updated: Send to /api/llama instead of /api/process-video
        const response = await fetch("/api/llama", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error("Failed to process video")
        }

        const result = await response.json()
        let patchedResult = result
        if (typeof result.response === 'string') {
          patchedResult = {
            id: Date.now().toString(),
            video_url: URL.createObjectURL(file), // Use local preview for video
            events: [],
            summary: result.response,
            captions: [],
          }
        }
        setProcessingResult(patchedResult)
        setCurrentStep("results")

        toast({
          title: "Video processed successfully!",
          description: "Your video has been analyzed and is ready for chat.",
        })
      } catch (error) {
        console.error("Error processing video:", error)
        toast({
          title: "Processing failed",
          description: "There was an error processing your video. Please try again.",
          variant: "destructive",
        })
        setCurrentStep("upload")
      } finally {
        setIsProcessing(false)
      }
    },
    [toast, isProcessing],
  )

  const handleNewVideo = useCallback(() => {
    setCurrentStep("upload")
    setProcessingResult(null)
    setIsProcessing(false)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative">
                <Eye className="h-8 w-8 text-blue-600" />
                <motion.div
                  className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Visual AI Assistant</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">Powered by RunPod GPU</p>
              </div>
            </motion.div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span>GPU Ready</span>
              </div>
              {currentStep === "results" && (
                <Button onClick={handleNewVideo} variant="outline">
                  New Video
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {currentStep === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl mx-auto"
            >
              {/* Hero Section */}
              <div className="text-center mb-12">
                <motion.h2
                  className="text-4xl font-bold text-slate-900 dark:text-white mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Understand Your Videos with AI
                </motion.h2>
                <motion.p
                  className="text-xl text-slate-600 dark:text-slate-400 mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Upload a video and get real-time object detection, action recognition, and intelligent chat
                </motion.p>
              </div>

              {/* Features Grid */}
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                {[
                  {
                    icon: Eye,
                    title: "Object Detection",
                    description: "YOLOv8n powered real-time object identification",
                    color: "text-blue-600",
                  },
                  {
                    icon: Activity,
                    title: "Action Recognition",
                    description: "SlowFast model for understanding video actions",
                    color: "text-green-600",
                  },
                  {
                    icon: Brain,
                    title: "Smart Chat",
                    description: "BLIP-2 + Ollama for intelligent video conversations",
                    color: "text-purple-600",
                  },
                ].map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  >
                    <Card className="h-full hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <feature.icon className={`h-8 w-8 ${feature.color} mb-2`} />
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription>{feature.description}</CardDescription>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Upload Section */}
              <VideoUpload onUpload={handleVideoUpload} />
            </motion.div>
          )}

          {currentStep === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl mx-auto"
            >
              <ProcessingStatus />
            </motion.div>
          )}

          {currentStep === "results" && processingResult && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="max-w-7xl mx-auto"
            >
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Left Column - Video & Timeline */}
                <div className="space-y-6">
                  {/* Video Player */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Video className="h-5 w-5" />
                        <span>Video Analysis</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {processingResult.video_url ? (
                        <video
                          src={processingResult.video_url}
                          controls
                          className="w-full rounded-lg"
                          poster="/video-thumbnail.png"
                        />
                      ) : (
                        <div className="w-full h-48 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400">
                          No video preview available
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Event Timeline */}
                  <EventTimeline events={processingResult.events} />
                </div>

                {/* Right Column - Chat */}
                <div>
                  <ChatInterface
                    videoId={processingResult.id}
                    initialSummary={processingResult.summary}
                    events={processingResult.events}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
