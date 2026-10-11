import os
import json
import asyncio
import logging
import aiohttp
from dotenv import load_dotenv
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli, llm
from livekit.agents.voice import Agent, AgentSession
from livekit.plugins import openai, tavus, silero

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("recruiter-agent")

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000").rstrip("/")

async def entrypoint(ctx: JobContext):
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # 1. Extract dynamic candidate & job dossier from the dispatch metadata
    job_context_str = ""
    candidate_name = "Candidate"
    interview_id = ctx.room.name.replace("interview-", "").strip()

    if ctx.job.metadata:
        try:
            meta = json.loads(ctx.job.metadata)
            candidate_name = meta.get("candidateName", "Candidate")
            if meta.get("interviewId"):
                interview_id = str(meta.get("interviewId")).strip()
            
            mcq_score = meta.get("mcqScore", "N/A")
            mcq_mistakes = meta.get("mcqMistakes", [])
            tech_score = meta.get("technicalScore", "N/A")
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
            logger.warning(f"Failed to parse job metadata: {e}")

    AGENT_INSTRUCTION = (
        "You are an observant, perceptive, and friendly Senior Technical Recruiter conducting a live screening interview. "
        "You are evaluating if the candidate is a genuine fit for the job role in the context below.\n\n"
        "STRICT 3-QUESTION INTERVIEW PROTOCOL:\n"
        "1. You must conduct this interview with EXACTLY 3 technical questions in total.\n"
        "2. QUESTION 1: Warmly greet the candidate by name, introduce yourself, and ask Question 1 (referencing their background or Stage 1 MCQ topics).\n"
        "3. QUESTION 2: Acknowledge their answer in 1 sentence, then ask Question 2 (probing their real projects, technical architecture, or trade-offs).\n"
        "4. QUESTION 3 (FINAL QUESTION): Acknowledge their answer in 1 sentence, then ask Question 3 (testing edge cases, scalability, or problem-solving).\n"
        "5. WRAP-UP & AUTO-END: Once the candidate finishes answering Question 3, you MUST NOT ask any further questions. "
        f"Deliver your warm closing wrap-up: 'Thank you {candidate_name}, that concludes our interview today. Best of luck with your application!' and stop speaking.\n"
        "6. INTERVIEW STYLE: Ask ONE question at a time. Keep your spoken responses concise (2 to 3 sentences maximum) so the candidate speaks most of the time.\n"
        "7. LANGUAGE: Strictly speak ONLY English. Do not speak foreign languages or hallucinate on background noise.\n"
        f"{job_context_str}"
    )

    # Initialize the OpenAI Realtime model for voice
    model = openai.realtime.RealtimeModel(
        voice="alloy",
        temperature=0.7,
        instructions=AGENT_INSTRUCTION,
    )

    # Thread-safe synchronization state to prevent duplicate backend completions
    interview_finalized = False
    finalizing_lock = asyncio.Lock()

    async def finalize_interview_record(transcript_data: list):
        nonlocal interview_finalized
        async with finalizing_lock:
            if interview_finalized:
                return
            interview_finalized = True

        logger.info(f"[Agent Worker] Finalizing interview {interview_id} on backend ({BACKEND_URL})...")
        try:
            async with aiohttp.ClientSession() as http_session:
                async with http_session.post(
                    f"{BACKEND_URL}/api/interviews/complete",
                    json={
                        "interviewId": interview_id,
                        "transcript": transcript_data
                    },
                    timeout=aiohttp.ClientTimeout(total=20)
                ) as response:
                    if response.status == 200:
                        logger.info(f"[Agent Worker] Successfully finalized interview {interview_id} on backend!")
                    else:
                        resp_body = await response.text()
                        logger.warning(f"[Agent Worker] Backend /complete returned status {response.status}: {resp_body}")
        except Exception as e:
            logger.error(f"[Agent Worker] Error finalizing backend interview {interview_id}: {e}")

    # Extract real conversation messages from agent history for 360° AI review
    def extract_transcript(agent_obj: Agent) -> list:
        records = []
        try:
            if hasattr(agent_obj, "chat_ctx") and agent_obj.chat_ctx and hasattr(agent_obj.chat_ctx, "messages"):
                for msg in agent_obj.chat_ctx.messages:
                    if msg.role in ["user", "assistant"] and msg.content:
                        records.append({"role": msg.role, "content": str(msg.content).strip()})
        except Exception as e:
            logger.warning(f"[Agent Worker] Could not read chat history: {e}")

        if not records:
            records = [
                {
                    "role": "system",
                    "content": f"Candidate {candidate_name} completed the 3-question live technical interview with AI Recruiter."
                }
            ]
        return records

    # Auto-finish callback triggered when candidate completes Question 3
    async def finish_interview():
        logger.info(f"[Agent Worker] Candidate {candidate_name} answered 3/3 questions. Initiating auto-finish...")
        # Disable interruptions so background noise cannot interrupt the closing wrap-up
        agent.allow_interruptions = False

        # Wait for the agent to finish vocalizing the closing wrap-up
        try:
            if session.current_speech:
                await asyncio.wait_for(session.current_speech.wait_for_playout(), timeout=8.0)
            else:
                await asyncio.sleep(6.5)
        except Exception:
            await asyncio.sleep(6.5)

        # 1. Broadcast interview_completed data packet to LiveKit room for frontend UI
        try:
            completed_payload = json.dumps({
                "type": "interview_completed",
                "candidateName": candidate_name,
                "message": f"Thank you {candidate_name}, interview completed."
            })
            if ctx.room.local_participant:
                await ctx.room.local_participant.publish_data(completed_payload.encode("utf-8"), reliable=True)
                logger.info(f"[Agent Worker] Published interview_completed packet to room {ctx.room.name}")
        except Exception as e:
            logger.warning(f"[Agent Worker] Error publishing completion packet: {e}")

        # 2. Call backend /api/interviews/complete endpoint to generate official scorecard
        transcript_data = extract_transcript(agent)
        await finalize_interview_record(transcript_data)

        # 3. Disconnect after short grace period
        await asyncio.sleep(2.0)
        try:
            await ctx.room.disconnect()
            logger.info(f"[Agent Worker] Room {ctx.room.name} auto-disconnected successfully!")
        except Exception as e:
            logger.warning(f"[Agent Worker] Error disconnecting room: {e}")

    # Custom Agent class tracking turns and enforcing 3-question sequence
    class RecruiterInterviewAgent(Agent):
        def __init__(self, c_name: str, room, on_finish_cb, *args, **kwargs):
            super().__init__(*args, **kwargs)
            self.c_name = c_name
            self.room = room
            self.on_finish_cb = on_finish_cb
            self.answered_count = 0
            self.completed = False

        async def on_user_turn_completed(self, turn_ctx: llm.ChatContext, new_message: llm.ChatMessage) -> None:
            if self.completed:
                return

            user_text = str(new_message.content or "").strip().lower()

            # Filter out non-substantive background noises or short grunts
            if len(user_text) < 3:
                logger.info(f"[Interview Progress] Ignoring short utterance (< 3 chars): '{user_text}'")
                return

            # Gracefully handle requests to repeat without advancing question count
            repeat_cues = ["repeat that", "repeat the question", "say that again", "pardon", "didn't hear"]
            if any(cue in user_text for cue in repeat_cues):
                logger.info(f"[Interview Progress] Candidate requested repeat: '{user_text}'")
                turn_ctx.messages.append(
                    llm.ChatMessage(
                        role="system",
                        content=(
                            f"The candidate asked you to repeat the question. "
                            f"Politely restate the current question clearly in 1 to 2 sentences without advancing to the next question."
                        )
                    )
                )
                return

            self.answered_count += 1
            logger.info(f"[Interview Progress] Candidate {self.c_name} answered question {self.answered_count}/3.")

            # Publish real-time progress update to the LiveKit room for the UI
            try:
                progress_payload = json.dumps({
                    "type": "interview_progress",
                    "currentQuestion": min(self.answered_count + 1, 3),
                    "totalQuestions": 3,
                    "answeredCount": self.answered_count,
                    "isLastQuestion": self.answered_count == 2,
                    "isCompleted": self.answered_count >= 3
                })
                if self.room.local_participant:
                    await self.room.local_participant.publish_data(progress_payload.encode("utf-8"), reliable=True)
            except Exception as e:
                logger.warning(f"[Interview Progress] Error publishing progress: {e}")

            if self.answered_count == 1:
                # Direct LLM to ask Question 2
                turn_ctx.messages.append(
                    llm.ChatMessage(
                        role="system",
                        content=(
                            f"QUESTION 2 OF 3: Briefly acknowledge the candidate's previous response in 1 concise sentence. "
                            f"Then ask Question 2 regarding practical technical architecture, system design, or verified projects from their profile. "
                            f"Ask ONLY this single question."
                        )
                    )
                )
            elif self.answered_count == 2:
                # Direct LLM to ask Question 3 (Final Question)
                turn_ctx.messages.append(
                    llm.ChatMessage(
                        role="system",
                        content=(
                            f"QUESTION 3 OF 3 (FINAL QUESTION): Briefly acknowledge their response in 1 concise sentence. "
                            f"Then ask Question 3, which is the final technical question testing problem-solving, trade-offs, or debugging. "
                            f"Ask ONLY this single question."
                        )
                    )
                )
            elif self.answered_count >= 3:
                # Candidate has answered all 3 questions! Conclude immediately.
                self.completed = True
                self.allow_interruptions = False

                turn_ctx.messages.append(
                    llm.ChatMessage(
                        role="system",
                        content=(
                            f"CRITICAL FINAL CLOSING INSTRUCTION: The candidate {self.c_name} has now responded to all 3 questions. "
                            f"DO NOT ASK ANY MORE QUESTIONS. "
                            f"Acknowledge their final response in 1 short sentence, and say your closing wrap-up: "
                            f"'Thank you {self.c_name}, that concludes our interview today. Best of luck with your application!' "
                            f"Do not say anything else."
                        )
                    )
                )
                # Auto-end interview after the closing response
                asyncio.create_task(self.on_finish_cb())

    agent = RecruiterInterviewAgent(
        c_name=candidate_name,
        room=ctx.room,
        on_finish_cb=finish_interview,
        vad=ctx.proc.userdata["vad"],
        llm=model,
        instructions=AGENT_INSTRUCTION,
    )

    session = AgentSession()

    # Initialize Tavus Video Avatar if credentials and credits are available
    replica_id = os.getenv("TAVUS_REPLICA_ID")
    tavus_started = False
    if replica_id and os.getenv("TAVUS_API_KEY"):
        try:
            avatar = tavus.AvatarSession(
                replica_id=replica_id,
                api_key=os.getenv("TAVUS_API_KEY"),
            )
            await avatar.start(session, room=ctx.room)
            tavus_started = True
            logger.info(f"[Agent Worker] Connected to room: {ctx.room.name} with Tavus Replica {replica_id}")
        except Exception as e:
            logger.warning(f"[Agent Worker] Tavus video avatar unavailable ({e}). Continuing in Real-Time Voice Audio Mode.")

    await session.start(agent, room=ctx.room)
    if not tavus_started:
        logger.info(f"[Agent Worker] Connected to room: {ctx.room.name} in Real-Time Voice Mode")

    @ctx.room.on("participant_disconnected")
    def on_participant_disconnected(participant):
        # Ignore disconnect events triggered by the agent itself
        if ctx.room.local_participant and participant.identity == ctx.room.local_participant.identity:
            return

        logger.info(f"[Agent Worker] Remote participant {participant.identity} disconnected. Finalizing session...")
        transcript_data = extract_transcript(agent)
        asyncio.create_task(finalize_interview_record(transcript_data))

    # Wait a brief moment for room audio pipelines to settle
    await asyncio.sleep(1.0)

    # Broadcast initial progress to frontend (Question 1 of 3)
    try:
        init_progress = json.dumps({
            "type": "interview_progress",
            "currentQuestion": 1,
            "totalQuestions": 3,
            "answeredCount": 0,
            "isLastQuestion": False,
            "isCompleted": False
        })
        if ctx.room.local_participant:
            await ctx.room.local_participant.publish_data(init_progress.encode("utf-8"), reliable=True)
    except Exception as e:
        logger.warning(f"Error publishing init progress: {e}")

    # Trigger the AI to speak first: Greet and ask Question 1 (uninterrupted opening)
    session.generate_reply(
        user_input=(
            f"The candidate {candidate_name} has joined the room. "
            f"Please greet them warmly by name, introduce yourself as the technical interviewer, "
            f"and ask Question 1 of 3 based on their technical background or Stage 1 MCQ topics."
        ),
        allow_interruptions=False
    )

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
