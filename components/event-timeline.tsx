"use client"

import { motion } from "framer-motion"
import { Clock, Eye, Activity, Tag } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Event {
  timestamp: number
  type: string
  description: string
  confidence: number
  objects: string[]
}

interface EventTimelineProps {
  events: Event[]
}

export function EventTimeline({ events }: EventTimelineProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getEventIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "object_detection":
        return Eye
      case "action_recognition":
        return Activity
      default:
        return Tag
    }
  }

  const getEventColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "object_detection":
        return "text-blue-600"
      case "action_recognition":
        return "text-green-600"
      default:
        return "text-purple-600"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Event Timeline</span>
          <Badge variant="secondary">{events.length} events</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[400px] p-4">
          <div className="space-y-4">
            {events.map((event, index) => {
              const Icon = getEventIcon(event.type)
              const colorClass = getEventColor(event.type)

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative flex items-start space-x-4 pb-4"
                >
                  {/* Timeline line */}
                  {index < events.length - 1 && (
                    <div className="absolute left-4 top-8 w-0.5 h-full bg-slate-200 dark:bg-slate-700" />
                  )}

                  {/* Event icon */}
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center ${colorClass}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Event content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {formatTime(event.timestamp)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(event.confidence * 100)}% confidence
                      </Badge>
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{event.description}</p>

                    {event.objects.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {event.objects.slice(0, 3).map((object, objIndex) => (
                          <Badge key={objIndex} variant="secondary" className="text-xs">
                            {object}
                          </Badge>
                        ))}
                        {event.objects.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{event.objects.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
