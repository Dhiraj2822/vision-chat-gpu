interface RunPodConfig {
  apiBase: string
  sshKey: string
  podId: string
}

interface ProcessingResult {
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

export class RunPodClient {
  private config: RunPodConfig

  constructor() {
    this.config = {
      apiBase: process.env.RUNPOD_API_BASE || "https://evrj8nq9h18vds-8080.proxy.runpod.net",
      sshKey: process.env.RUNPOD_SSH_KEY || "/app/keys/vuencode_teamXX_id_ed25519",
      podId: process.env.RUNPOD_POD_ID || "btednxbqzscmco",
    }
  }

  async startPod(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.apiBase}/pods/${this.config.podId}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        console.log("Pod started successfully")
        // Wait for pod to be ready
        await new Promise((resolve) => setTimeout(resolve, 30000))
        return true
      } else {
        console.error("Failed to start pod:", response.status)
        return false
      }
    } catch (error) {
      console.error("Error starting pod:", error)
      return false
    }
  }

  async stopPod(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.apiBase}/pods/${this.config.podId}/stop`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        console.log("Pod stopped successfully")
        return true
      } else {
        console.error("Failed to stop pod:", response.status)
        return false
      }
    } catch (error) {
      console.error("Error stopping pod:", error)
      return false
    }
  }

  async processVideo(videoFile: File): Promise<ProcessingResult> {
    try {
      // Start pod
      const podStarted = await this.startPod()
      if (!podStarted) {
        throw new Error("Failed to start RunPod")
      }

      // Upload and process video via SSH
      // This would typically use a Python script or direct SSH connection
      // For now, we'll simulate the processing

      const formData = new FormData()
      formData.append("video", videoFile)

      const response = await fetch(`${this.config.apiBase}/process`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Processing failed")
      }

      const result = await response.json()

      // Stop pod
      await this.stopPod()

      return result
    } catch (error) {
      // Ensure pod is stopped even on error
      await this.stopPod()
      throw error
    }
  }
}

export const runpodClient = new RunPodClient()
