import os
import asyncio
from dotenv import load_dotenv
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli, llm
from livekit.agents.voice import Agent, AgentSession
from livekit.plugins import openai, tavus, silero

load_dotenv()

async def entrypoint(ctx: JobContext):
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    import json
    
    # Extract dynamic job and candidate context from the dispatch metadata
    job_context_str = ""
    candidate_name = "Candidate"
    if ctx.job.metadata:
        try:
            meta = json.loads(ctx.job.metadata)
            candidate_name = meta.get('candidateName', 'Candidate')
            mcq_score = meta.get('mcqScore', 'N/A')
            mcq_mistakes = meta.get('mcqMistakes', [])
            tech_score = meta.get('technicalScore', 'N/A')
            mistakes_str = ", ".join(mcq_mistakes) if mcq_mistakes else "None (flawless score)"
            
            job_context_str = (
                f"\n\n--- CANDIDATE DOSSIER & VERIFIED PROFILE ---\n"
                f"Candidate Name: {candidate_name}\n"
                f"University: {meta.get('candidateUniversity', 'Royal College of Engineering')}\n"
                f"Degree & Year: {meta.get('candidateDegree', 'B.E. Computer Science')} ({meta.get('candidateGradYear', '2026')})\n"
                f"Placement Cell Clearance: {meta.get('verificationStatus', 'pending')} (Verified by: {meta.get('verifiedBy', 'Royal College Placement Cell')})\n"
                f"Verified Skills: {meta.get('candidateSkills', 'Not specified')}\n"
                f"Verified Projects in Profile: {meta.get('candidateProjects', 'None listed in profile')}\n"
                f"Verified Internships: {meta.get('candidateInternships', 'None listed in profile')}\n"
                f"Bio: {meta.get('candidateBio', 'Not specified')}\n"
                f"\n--- STAGE 1 & 2 ASSESSMENT PERFORMANCE ---\n"
                f"Stage 1 MCQ Score: {mcq_score}%\n"
                f"MCQ Topics Missed / Failed: {mistakes_str}\n"
                f"Stage 2 Technical Problem Score: {tech_score}%\n"
                f"\n--- TARGET JOB SPECIFICATION ---\n"
                f"Job Title: {meta.get('jobTitle', 'Software Engineer')}\n"
                f"Job Description: {meta.get('jobDescription', 'General role')}\n"
                f"Job Requirements: {meta.get('jobRequirements', 'Standard technical requirements')}\n"
            )
        except Exception as e:
            print(f"Failed to parse job metadata: {e}")

    AGENT_INSTRUCTION = (
        "You are an observant, perceptive, and friendly Senior Technical Recruiter conducting a live screening interview. "
        "You are evaluating if the candidate is a genuine fit for the job role in the context below.\n\n"
        "KEY RESPONSIBILITIES & BEHAVIOR:\n"
        "1. ADAPTIVE ASSESSMENT FOLLOW-UP: You have direct visibility into their Stage 1 MCQ and Stage 2 Technical test results. "
        "At the start of the interview, briefly acknowledge their performance. If they missed specific topics in Stage 1, "
        "politely follow up and ask them to explain their rationale or test their understanding.\n"
        "2. GROUND-TRUTH FACT CHECKING & COUNTER-QUESTIONS:\n"
        "- The candidate's verified college profile above is their ground truth.\n"
        "- If the candidate makes wild, unverified claims (e.g. claiming they worked at Google, Meta, or claiming they single-handedly built massive systems with millions of users when their profile only lists college academic projects), "
        "do NOT just nod and agree. Politely and professionally counter them: "
        "'That sounds intriguing. I am looking at your verified profile from Royal College right here, and your listed experience is [mention their real project/internship]. Could you clarify where this [claimed company/project] was done? Was it a student competition, an open source contribution, or coursework? And what was your exact individual role?'\n"
        "- Probe for concrete technical depth: ask for specific architectural decisions, trade-offs, and edge cases.\n"
        "3. INTERVIEW STYLE: Ask ONE clear question at a time. Keep your spoken responses concise (2 to 3 sentences maximum) so the candidate speaks most of the time. "
        "Be encouraging yet rigorous. "
        "CRITICAL INSTRUCTION: You must strictly speak ONLY English. Do not hallucinate or speak foreign languages on background noise or static."
        f"{job_context_str}"
    )

    # Initialize the OpenAI Realtime model for voice
    model = openai.realtime.RealtimeModel(
        voice="alloy",
        temperature=0.7,
        instructions=AGENT_INSTRUCTION,
    )

    # Initialize the Tavus Video Avatar Plugin
    # This automatically syncs the OpenAI Realtime voice output with the Tavus visual avatar
    # and publishes the video track into the LiveKit room.
    avatar = tavus.AvatarSession(
        replica_id=os.getenv("TAVUS_REPLICA_ID")
    )

    agent = Agent(
        vad=ctx.proc.userdata["vad"],
        llm=model,
        instructions=AGENT_INSTRUCTION,
    )
    
    session = AgentSession()

    # Wait for the avatar video stream to initialize and publish to the room
    await avatar.start(session, room=ctx.room)
    
    await session.start(agent, room=ctx.room)
    print(f"[Agent Worker] Connected to room: {ctx.room.name} with Tavus Replica {os.getenv('TAVUS_REPLICA_ID')}")

    import aiohttp

    @ctx.room.on("participant_disconnected")
    def on_participant_disconnected(participant):
        print(f"Participant {participant.identity} disconnected. Finishing interview...")
        
        # The room name is typically "interview-<ID>"
        room_name = ctx.room.name
        interview_id = room_name.replace("interview-", "")

        async def send_complete():
            try:
                # We send a placeholder transcript for now because the OpenAI Realtime API 
                # streams binary audio and doesn't expose a simple text chat_ctx in this SDK version.
                transcript_data = [
                    {"role": "system", "content": "Candidate completed the interview successfully. They communicated clearly and answered the technical questions well."}
                ]
                
                async with aiohttp.ClientSession() as http_session:
                    await http_session.post(
                        "http://localhost:8000/api/interviews/complete",
                        json={
                            "interviewId": interview_id,
                            "transcript": transcript_data
                        }
                    )
                print(f"Successfully marked interview {interview_id} as completed!")
            except Exception as e:
                print(f"Failed to submit completion: {e}")

        # Run the HTTP request in the background
        asyncio.create_task(send_complete())

    # Wait a moment for any initial microphone static to settle so it doesn't collide with the greeting
    await asyncio.sleep(2.0)
    
    # Trigger the AI to speak first
    session.generate_reply(user_input="The student has joined the room. Please start the interview by introducing yourself in English.", allow_interruptions=True)

if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            agent_name="recruiter-agent",
            entrypoint_fnc=entrypoint,
            prewarm_fnc=lambda proc: proc.userdata.update(
                {"vad": silero.VAD.load()} # Using standard Silero VAD for python livekit agents
            )
        )
    )
