import { GoogleGenAI } from "@google/genai";

// Helper to safely get environment variables in Vite/Browser environment
const getEnvVar = (name: string): string => {
  try {
    // Try process.env (injected by some environments)
    if (typeof process !== 'undefined' && process.env && process.env[name]) {
      return process.env[name] as string;
    }
    // Try import.meta.env (Vite standard)
    // @ts-ignore
    if (import.meta.env && import.meta.env[`VITE_${name}`]) {
      // @ts-ignore
      return import.meta.env[`VITE_${name}`] as string;
    }
  } catch (e) {
    console.warn(`Error accessing env var ${name}:`, e);
  }
  return "";
};

export async function transcribeSpanishToKorean(text: string): Promise<string> {
  if (!text.trim()) return "";

  // Try to get the API key from multiple possible sources
  const apiKey = getEnvVar("API_KEY") || getEnvVar("GEMINI_API_KEY") || "";
  
  if (!apiKey) {
    throw new Error("API Key가 설정되지 않았습니다. 상단의 설정(⚙️) 아이콘을 눌러 API Key를 선택해 주세요.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const prompt = `Translate the following Spanish text into its phonetic pronunciation written in Korean (Hangul). 
    Rules:
    1. Provide ONLY the Korean phonetic transcription.
    2. Make it sound as natural as possible for a Korean speaker to pronounce.
    3. If there are multiple words, maintain the spacing.
    4. Do not include the original Spanish text or any explanation.
    
    Spanish text: "${text}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.1,
      }
    });

    if (!response || !response.text) {
      throw new Error("AI로부터 응답을 받지 못했습니다.");
    }

    return response.text;
  } catch (error: any) {
    console.error("Transcription error details:", error);
    
    // Handle specific API errors
    if (error.message?.includes("API key not valid")) {
      throw new Error("유효하지 않은 API Key입니다. 다시 설정해 주세요.");
    }
    if (error.message?.includes("quota")) {
      throw new Error("API 사용량이 초과되었습니다. 나중에 다시 시도해 주세요.");
    }
    
    throw new Error(`변환 실패: ${error.message || "알 수 없는 오류가 발생했습니다."}`);
  }
}
