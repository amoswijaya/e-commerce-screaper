import OpenAI from "openai";

export const aiClient = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_API_URL || "https://api.deepseek.com/v1",
});
