"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Loader2, Zap, Eye, Activity, Brain, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const processingSteps = [
  {
    id: "pod_start",
    title: "Starting RunPod GPU",
    description: "Initializing GPU pod for processing",
    icon: Zap,
    duration: 3000,
  },
  {
    id: "frame_extraction",
    title: "Extracting Frames",
    description: "Using FFmpeg to extract video frames",
    icon: Eye,
    duration: 4000,
  },
  {
    id: "object_detection",
    title: "Object Detection",
    description: "Running YOLOv8n for object identification",
    icon: Eye,
    duration: 6000,
  },
  {
    id: "action_recognition",
    title: "Action Recognition",
    description: "Analyzing actions with SlowFast model",
    icon: Activity,
    duration: 5000,
  },
  {
    id: "scene_captioning",
    title: "Scene Captioning",
    description: "Generating captions with BLIP-2",
    icon: Brain,
    duration: 4000,
  },
  {
    id: "llm_processing",
    title: "AI Analysis",
    description: "Processing with Ollama LLM",
    icon: Brain,
    duration: 3000,
  },
]

export function ProcessingStatus() {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])

  useEffect(() => {
    let stepTimer: NodeJS.Timeout
    let progressTimer: NodeJS.Timeout

    const startStep = (stepIndex: number) => {
      if (stepIndex >= processingSteps.length) return

      const step = processingSteps[stepIndex]
      setCurrentStep(stepIndex)
      setProgress(0)

      // Animate progress for current step
      const progressIncrement = 100 / (step.duration / 100)
      progressTimer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressTimer)
            setCompletedSteps((prev) => [...prev, step.id])

            // Start next step after a brief delay
            stepTimer = setTimeout(() => {
              startStep(stepIndex + 1)
            }, 500)

            return 100
          }
          return prev + progressIncrement
        })
      }, 100)
    }

    startStep(0)

    return () => {
      clearTimeout(stepTimer)
      clearInterval(progressTimer)
    }
  }, [])

  const overallProgress = ((completedSteps.length + progress / 100) / processingSteps.length) * 100

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span>Processing Your Video</span>
          </CardTitle>
          <p className="text-slate-600 dark:text-slate-400">Our AI models are analyzing your video on RunPod GPU</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Overall Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-slate-600 dark:text-slate-400">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </div>

          {/* Processing Steps */}
          <div className="space-y-4">
            {processingSteps.map((step, index) => {
              const Icon = step.icon
              const isCompleted = completedSteps.includes(step.id)
              const isCurrent = index === currentStep
              const isUpcoming = index > currentStep

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center space-x-4 p-4 rounded-lg border ${
                    isCompleted
                      ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                      : isCurrent
                        ? "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800"
                        : "bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      isCompleted
                        ? "bg-green-600 text-white"
                        : isCurrent
                          ? "bg-blue-600 text-white"
                          : "bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : isCurrent ? (
                      <Icon className="h-5 w-5 animate-pulse" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>

                  <div className="flex-1">
                    <h3
                      className={`font-medium ${
                        isCompleted
                          ? "text-green-900 dark:text-green-100"
                          : isCurrent
                            ? "text-blue-900 dark:text-blue-100"
                            : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {step.title}
                    </h3>
                    <p
                      className={`text-sm ${
                        isCompleted
                          ? "text-green-700 dark:text-green-300"
                          : isCurrent
                            ? "text-blue-700 dark:text-blue-300"
                            : "text-slate-500 dark:text-slate-500"
                      }`}
                    >
                      {step.description}
                    </p>

                    {isCurrent && (
                      <div className="mt-2">
                        <Progress value={progress} className="h-1" />
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
