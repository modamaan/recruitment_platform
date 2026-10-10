import { fileURLToPath } from 'node:url';
import { Agent, ServerOptions, cli, defineAgent, voice } from '@livekit/agents';
import * as openai from '@livekit/agents-plugin-openai';
import dotenv from 'dotenv';

dotenv.config();

export function createAgent() {
  return Agent.create({
    instructions:
      'You are a professional and friendly technical recruiter for a modern tech company. ' +
      'You are conducting an initial screening interview with a student. ' +
      'Ask them about their background, their experience with React or Node.js, and what they are looking for in their next role. ' +
      'Ask one question at a time. Be welcoming, concise, and professional.',
    // Using the OpenAI Realtime model for ultra-low latency voice-to-voice
    llm: new openai.realtime.RealtimeModel({ voice: 'alloy' }),
  });
}

export default defineAgent({
  entry: async (ctx) => {
    // Omit STT and TTS — RealtimeModel handles both natively
    const session = new voice.AgentSession({});

    await session.start({
      agent: createAgent(),
      room: ctx.room,
    });

    await ctx.connect();
    console.log(`[Agent Worker] Connected to room: ${ctx.room.name}`);

    session.generateReply({
      instructions: 'Greet the user, welcome them to the interview, and ask them to introduce themselves.',
    });
  },
});

cli.runApp(
  new ServerOptions({
    agent: fileURLToPath(import.meta.url),
    agentName: 'recruiter-agent',
  }),
);
