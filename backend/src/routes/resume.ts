import { Router } from "express";
import multer from "multer";
const pdf = require("pdf-parse");
import OpenAI from "openai";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/parse", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Extract text from the uploaded PDF
    const data = await pdf(req.file.buffer);
    const text = data.text;

    // Call OpenAI to extract structured data
    const prompt = `
You are an expert recruiter AI. I will provide you with the text extracted from a candidate's resume.
Your job is to parse this text and return a JSON object with the following fields:
- name: (string) The candidate's full name.
- email: (string) The candidate's email address.
- university: (string) The main university or college they attended.
- degree: (string) The degree and major they pursued.
- gradYear: (number) The year they graduated or will graduate.
- phone: (string) The candidate's phone number.
- skills: (string) A comma-separated list of their top 5-7 skills.
- linkedin: (string) Their LinkedIn URL (if found).
- github: (string) Their GitHub or portfolio URL (if found).
- bio: (string) A professional 3-sentence summary based on their experience and skills.

Respond ONLY with the JSON object. Do not wrap it in markdown blockquotes like \`\`\`json.
Just output the raw JSON. If a field is not found, leave it as an empty string (or null for numbers).

Resume Text:
${text}
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
    });

    const aiResponse = completion.choices[0]?.message?.content || "{}";
    
    let parsedData = {};
    try {
      parsedData = JSON.parse(aiResponse);
    } catch (parseError) {
      // In case the AI still output markdown, attempt to strip it
      const cleanedResponse = aiResponse.replace(/```json/g, "").replace(/```/g, "").trim();
      parsedData = JSON.parse(cleanedResponse);
    }

    res.json(parsedData);
  } catch (error) {
    console.error("Error parsing resume:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to parse resume" });
  }
});

export default router;
