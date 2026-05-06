const GROQ_API_KEY = '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';

const CATEGORY = 'medical';

const TERMS = [
  // Symptoms
  'Nausea', 'Vomiting', 'Dizziness', 'Fever', 'Fatigue',
  'Chest pain', 'Shortness of breath', 'Headache', 'Palpitations',
  'Chills', 'Sweating', 'Swelling', 'Numbness', 'Tingling',
  'Blurred vision', 'Rash', 'Itching', 'Bruising', 'Bleeding',
  'Loss of appetite', 'Weight loss', 'Weight gain', 'Insomnia',

  // Procedures & Tests
  'Blood transfusion', 'Dialysis', 'Endoscopy', 'Colonoscopy',
  'Biopsy', 'MRI', 'CT scan', 'Ultrasound', 'Anesthesia',
  'Blood pressure', 'Blood test', 'Urine test', 'ECG',
  'Surgery', 'Stitches', 'Vaccination', 'IV drip', 'Catheter',

  // Conditions
  'Fracture', 'Dislocation', 'Sprain', 'Infection', 'Inflammation',
  'Allergy', 'Asthma', 'Diabetes', 'Hypertension', 'Anemia',
  'Stroke', 'Heart attack', 'Seizure', 'Concussion', 'Burns',
  'Appendicitis', 'Pneumonia', 'Bronchitis', 'Gastritis', 'Ulcer',
  'Tumor', 'Cyst', 'Hernia', 'Abscess', 'Hemorrhage',

  // Medications
  'Antibiotic', 'Painkiller', 'Anti-inflammatory', 'Sedative',
  'Blood thinner', 'Insulin', 'Inhaler', 'Ointment', 'Suppository',
  'Dose', 'Prescription', 'Side effects', 'Overdose', 'Allergy to medication',

  // Legal terms
  'Medical malpractice', 'Informed consent', 'Power of attorney',
  'Living will', 'Medical record', 'Patient rights', 'Discharge',
  'Referral', 'Second opinion', 'Insurance claim',
];

async function translateTerm(english, category) {
  const prompt = `You are an expert Arabic interpreter specializing in ${category} terminology.
Translate this ${category} term into three Arabic dialects: "${english}"
You MUST respond with ONLY a valid JSON object, no markdown, no explanation, no backticks.
The JSON must have exactly these four fields:
- arabicMSA: Modern Standard Arabic (فصحى)
- arabicEgyptian: Egyptian colloquial Arabic (عامية مصرية)
- arabicLevantine: Levantine colloquial Arabic (شامية)
- notes: short English note max 20 words or empty string
Only provide the JSON. Example: {"arabicMSA":"غثيان","arabicEgyptian":"غثيان","arabicLevantine":"دوخة معدة","notes":""}`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content ?? '';
  const cleaned = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

async function main() {
  const results = [];
  const failed = [];

  console.log(`\nStarting translation of ${TERMS.length} terms...\n`);

  for (let i = 0; i < TERMS.length; i++) {
    const term = TERMS[i];
    process.stdout.write(`[${i + 1}/${TERMS.length}] Translating: ${term} ... `);

    try {
      const suggestion = await translateTerm(term, CATEGORY);
      const categoryLabel = CATEGORY.charAt(0).toUpperCase() + CATEGORY.slice(1);
      results.push({
        id: `gen_${i + 1}`,
        english: term,
        arabicMSA: suggestion.arabicMSA,
        arabicEgyptian: suggestion.arabicEgyptian,
        arabicLevantine: suggestion.arabicLevantine,
        category: categoryLabel,
        notes: suggestion.notes || '',
      });
      console.log('done');
    } catch (e) {
      console.log(`FAILED — ${e.message}`);
      failed.push(term);
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 250));
  }

  console.log('\n\n// ---- PASTE THIS INTO glossary.ts (inside GLOSSARY_DB array) ----\n');
  console.log(JSON.stringify(results, null, 2)
    .replace(/^\[/, '')
    .replace(/\]$/, '')
    .trim()
  );

  if (failed.length > 0) {
    console.log(`\n\n// ---- FAILED TERMS (${failed.length}) — re-add these to TERMS and run again ----`);
    failed.forEach(t => console.log(`//   '${t}',`));
  }

  console.log(`\n\n// Done! ${results.length} terms generated successfully.`);
}

main();