"use client"

import type React from "react"

import { useCallback, useState } from "react"
import { motion } from "framer-motion"
import { Upload, Video, FileVideo, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface VideoUploadProps {
  onUpload: (file: File) => void
}

export function VideoUpload({ onUpload }: VideoUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    const videoFile = files.find((file) => file.type.startsWith("video/"))

    if (videoFile) {
      setSelectedFile(videoFile)
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("video/")) {
      setSelectedFile(file)
    }
  }, [])

  const handleUpload = useCallback(() => {
    if (selectedFile) {
      // Simulate upload progress
      setUploadProgress(0)
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            // Use setTimeout to defer the onUpload call to avoid render-phase updates
            setTimeout(() => {
              onUpload(selectedFile)
            }, 0)
            return 100
          }
          return prev + 10
        })
      }, 200)
    }
  }, [selectedFile, onUpload])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <motion.div
            className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isDragOver ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" : "border-slate-300 dark:border-slate-600"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <input
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />

            <motion.div animate={{ y: isDragOver ? -5 : 0 }} transition={{ duration: 0.2 }}>
              <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Drop your video here</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">or click to browse files</p>
              <p className="text-sm text-slate-500 dark:text-slate-500">Supports MP4, MOV, AVI, WebM (max 2GB)</p>
            </motion.div>
          </motion.div>
        </CardContent>
      </Card>

      {selectedFile && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <FileVideo className="h-10 w-10 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-medium text-slate-900 dark:text-white truncate">{selectedFile.name}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {formatFileSize(selectedFile.size)} • {selectedFile.type}
                  </p>

                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-slate-600 dark:text-slate-400">Uploading...</span>
                        <span className="text-slate-600 dark:text-slate-400">{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {uploadProgress === 0 && (
                    <Button onClick={handleUpload} className="ml-4">
                      <Video className="h-4 w-4 mr-2" />
                      Process Video
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-1">Processing will include:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                      <li>Object detection with YOLOv8n</li>
                      <li>Action recognition with SlowFast</li>
                      <li>Scene captioning with BLIP-2</li>
                      <li>AI-powered chat with Ollama</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
