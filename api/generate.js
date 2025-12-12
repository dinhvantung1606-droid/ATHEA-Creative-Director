import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Missing GEMINI_API_KEY" });

    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== "string" || prompt.length < 5) {
      return res.status(400).json({ error: "Invalid prompt" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const result = await model.generateContent(prompt);
    const text = result?.response?.text?.() ?? "";

    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ error: "Gemini call failed", detail: String(err?.message || err) });
  }
}
