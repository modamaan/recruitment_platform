"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, PhoneOff, Settings2 } from "lucide-react"

export default function InterviewRoomPage() {
  const [isActive, setIsActive] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [timer, setTimer] = useState(0)

  // Simple timer logic for mockup
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isActive) {
      interval = setInterval(() => setTimer(t => t + 1), 1000)
    }
    return () => clearInterval(interval)
  }, [isActive])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">AI Technical Screen</h1>
        <p className="text-muted-foreground">Frontend Engineer Role - TechCorp Inc.</p>
        <p className="text-xl font-mono mt-4">{isActive ? formatTime(timer) : "00:00"}</p>
      </div>

      <Card className="w-full max-w-2xl border-none shadow-none bg-transparent">
        <CardContent className="flex flex-col items-center justify-center space-y-12">
          
          {/* AI Voice Visualizer Mockup */}
          <div className="relative flex items-center justify-center size-48 rounded-full bg-primary/5">
            {isActive && (
              <div className="absolute inset-0 rounded-full animate-ping bg-primary/20" style={{ animationDuration: '3s' }} />
            )}
            <div className={`size-32 rounded-full flex items-center justify-center transition-colors duration-500 ${isActive ? 'bg-primary/20' : 'bg-muted'}`}>
              <Mic className={`size-12 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
          </div>

          <div className="text-center">
            {isActive ? (
              <p className="text-lg font-medium animate-pulse text-primary">"Hello! Tell me about a time you optimized a React application..."</p>
            ) : (
              <p className="text-lg font-medium text-muted-foreground">Ready to start the interview?</p>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-6 p-4 rounded-full bg-muted/50">
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full size-12"
            >
              <Settings2 className="size-5" />
            </Button>

            {!isActive ? (
              <Button 
                size="lg" 
                className="rounded-full px-8 h-12"
                onClick={() => setIsActive(true)}
              >
                Start Interview
              </Button>
            ) : (
              <>
                <Button 
                  variant={isMuted ? "destructive" : "secondary"}
                  size="icon" 
                  className="rounded-full size-12"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
                </Button>
                
                <Button 
                  variant="destructive"
                  size="icon" 
                  className="rounded-full size-12"
                  onClick={() => setIsActive(false)}
                >
                  <PhoneOff className="size-5" />
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
