"use client"

import { useState, useEffect, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { LiveKitRoom, RoomAudioRenderer, VoiceAssistantControlBar } from "@livekit/components-react";
import "@livekit/components-styles";

function InterviewRoomContent() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const interviewId = params?.id;
  const [token, setToken] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  useEffect(() => {
    async function getToken() {
      try {
        let authData;
        try {
          authData = await authClient.token();
        } catch (err) {
          router.push("/login");
          return;
        }
        const jwtToken = authData.data?.token;

        if (!jwtToken) {
          router.push("/login");
          return;
        }

        const res = await fetch(`${backendUrl}/api/interview/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${jwtToken}`
          },
          body: JSON.stringify({ interviewId })
        });

        if (!res.ok) {
          throw new Error("Failed to generate interview token. Are your LiveKit keys correct in the backend?");
        }

        const data = await res.json();
        setToken(data.token);
        setRoomName(data.roomName);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      }
    }

    getToken();
  }, [backendUrl, interviewId, router]);

  if (error) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-red-500 bg-red-100 p-6 rounded-lg shadow-md max-w-md text-center">
          <h2 className="text-xl font-bold mb-2">Connection Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!token || !roomName) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="size-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mb-4"></div>
          <p className="text-muted-foreground">Preparing your interview room...</p>
        </div>
      </div>
    );
  }

  if (!livekitUrl) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-red-500 bg-red-100 p-6 rounded-lg shadow-md max-w-md text-center">
          <h2 className="text-xl font-bold mb-2">Configuration Error</h2>
          <p>NEXT_PUBLIC_LIVEKIT_URL is missing in .env.local</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[85vh] w-full items-center justify-center bg-zinc-950 rounded-xl overflow-hidden shadow-2xl border border-zinc-800 p-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">AI Interview Room</h1>
        <p className="text-zinc-400 mt-2">Room: {roomName}</p>
      </div>

      <LiveKitRoom
        token={token}
        serverUrl={livekitUrl}
        connect={true}
        audio={true}
        video={false}
        data-lk-theme="default"
        className="flex flex-col items-center justify-center w-full max-w-2xl"
      >
        <RoomAudioRenderer />

        <div className="flex flex-col items-center justify-center py-12 px-6 w-full bg-zinc-900 rounded-2xl border border-zinc-800 shadow-inner">
          <div className="relative flex items-center justify-center size-32 mb-8">
            {/* Pulsing AI Indicator */}
            <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
            <div className="absolute inset-2 bg-blue-500/40 rounded-full animate-pulse"></div>
            <div className="relative z-10 size-16 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/50">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" x2="12" y1="19" y2="22"></line>
              </svg>
            </div>
          </div>
          <p className="text-zinc-300 text-center mb-8 text-lg font-medium">The AI Recruiter will join shortly...</p>

          <VoiceAssistantControlBar />
        </div>
      </LiveKitRoom>
    </div>
  );
}

export default function InterviewRoomPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="size-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mb-4"></div>
          <p className="text-muted-foreground">Preparing your interview room...</p>
        </div>
      </div>
    }>
      <InterviewRoomContent />
    </Suspense>
  );
}
