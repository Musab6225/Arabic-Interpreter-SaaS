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

  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('No API key found. Add EXPO_PUBLIC_GROQ_API_KEY to your .env file.');
  }

  const prompt = `You are an expert Arabic interpreter specializing in ${category} terminology.
Translate this ${category} term into three Arabic dialects: "${englishTerm}"
You MUST respond with ONLY a valid JSON object, no markdown, no explanation, no backticks.
The JSON must have exactly these four fields:
- arabicMSA: Modern Standard Arabic (فصحى)
- arabicEgyptian: Egyptian colloquial Arabic (عامية مصرية)
- arabicLevantine: Levantine colloquial Arabic (شامية)
- notes: short English note max 20 words or empty string
Only provide the JSON. Example: {"arabicMSA":"قلب","arabicEgyptian":"ألب","arabicLevantine":"قلب","notes":""}`;

  let response: Response;

  try {
    response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.2,
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });
  } catch (networkError) {
    throw new Error('Network error — check your internet connection.');
  }

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const rawText: string = data?.choices?.[0]?.message?.content ?? '';

  if (!rawText) {
    throw new Error('No response from Groq. Please try again.');
  }

  const cleaned = rawText.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(cleaned) as AISuggestion;
  } catch {
    throw new Error('Unexpected format from AI. Please try again.');
  }
}