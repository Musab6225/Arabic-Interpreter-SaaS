export interface AISuggestion {
  arabicMSA: string;
  arabicEgyptian: string;
  arabicLevantine: string;
  notes: string;
}

export async function fetchAISuggestion(
  englishTerm: string,
  category: 'medical' | 'legal'
): Promise<AISuggestion> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  console.log("API KEY EXISTS:", !!apiKey);
  console.log("KEY PREVIEW:", apiKey?.slice(0, 12));

  if (!apiKey) {
    throw new Error('No API key found. Add EXPO_PUBLIC_GEMINI_API_KEY to your .env file.');
  }

  const prompt = `You are an expert Arabic interpreter specializing in ${category} terminology. Translate this ${category} term into three Arabic dialects: "${englishTerm}". Respond with ONLY a valid JSON object, no markdown, no backticks, no explanation. Use exactly these four fields: arabicMSA, arabicEgyptian, arabicLevantine, notes. Example: {"arabicMSA":"قلب","arabicEgyptian":"قلب","arabicLevantine":"قلب","notes":""}`;

  let response: Response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 300 },
        }),
      }
    );
  } catch (networkError) {
    throw new Error('Network error — check your internet connection.');
  }

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  if (!rawText) {
    throw new Error('No response from Gemini. Please try again.');
  }

  const cleaned = rawText.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(cleaned) as AISuggestion;
  } catch {
    throw new Error('Unexpected format from AI. Please try again.');
  }
}