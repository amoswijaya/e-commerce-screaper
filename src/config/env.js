import "dotenv/config";

if (!process.env.DEEPSEEK_API_KEY) {
  console.warn("DEEPSEEK_API_KEY is not set. AI normalization will fail.");
}
