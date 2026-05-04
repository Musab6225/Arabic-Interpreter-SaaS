// src/data/ethicsGuide.ts
export interface EthicsScenario {
  id: string;
  title: string;
  situation: string;
  question: string;
  options: {
    text: string;
    isCorrect: boolean;
    explanation: string;
  }[];
  standard: string; // ISITC, NAATI, etc.
  category: 'accuracy' | 'confidentiality' | 'impartiality' | 'professional-conduct';
}

export const ethicsScenarios: EthicsScenario[] = [
  {
    id: '1',
    title: 'Attorney Asks for Summary',
    situation: 'During a legal deposition, the attorney turns to you and says: "Just give me the gist of what he said, don\'t interpret word-for-word."',
    question: 'What is your professional obligation?',
    options: [
      {
        text: 'Provide a concise summary to keep proceedings efficient',
        isCorrect: false,
        explanation: 'Summarizing violates accuracy standards. You must render everything faithfully, including false starts, emotions, and register.',
      },
      {
        text: 'Politely decline and interpret everything verbatim',
        isCorrect: true,
        explanation: 'Correct. ISITC Standard 2.1 requires complete and accurate interpretation. You may explain to the attorney that summarization would compromise the record.',
      },
      {
        text: 'Summarize only if the witness agrees',
        isCorrect: false,
        explanation: 'Witness consent does not override your duty to the court record. The obligation is to accuracy, not convenience.',
      },
    ],
    standard: 'ISITC Standard 2.1 — Accuracy and Completeness',
    category: 'accuracy',
  },
  {
    id: '2',
    title: 'Client Asks for Advice',
    situation: 'A defendant in a criminal case asks you: "Should I take the plea deal? What would you do?"',
    question: 'How should you respond?',
    options: [
      {
        text: 'Share your personal opinion to help them decide',
        isCorrect: false,
        explanation: 'Providing legal advice is outside your scope of practice and violates impartiality standards.',
      },
      {
        text: 'Interpret the question for the attorney and remain neutral',
        isCorrect: true,
        explanation: 'Correct. NAATI Code 3.2 requires interpreters to maintain impartiality and not engage in advocacy or advice.',
      },
      {
        text: 'Tell them you cannot help and stop interpreting',
        isCorrect: false,
        explanation: 'While you cannot advise, you must continue interpreting. Direct the question to the attorney through interpretation.',
      },
    ],
    standard: 'NAATI Code 3.2 — Impartiality',
    category: 'impartiality',
  },
  {
    id: '3',
    title: 'Overheard Confidential Information',
    situation: 'While waiting outside the courtroom, you overhear the opposing counsel discussing case strategy. Later, your client asks what you heard.',
    question: 'What is the appropriate action?',
    options: [
      {
        text: 'Share what you heard to help your client prepare',
        isCorrect: false,
        explanation: 'Disclosing overheard information violates confidentiality, even if it seems advantageous.',
      },
      {
        text: 'Decline to share and remind them of confidentiality obligations',
        isCorrect: true,
        explanation: 'Correct. ISITC Standard 4.1 mandates confidentiality of all information acquired in the course of duty.',
      },
      {
        text: 'Share only if it does not affect the case outcome',
        isCorrect: false,
        explanation: 'There is no "harmless disclosure" exception. All information is protected regardless of perceived impact.',
      },
    ],
    standard: 'ISITC Standard 4.1 — Confidentiality',
    category: 'confidentiality',
  },
  {
    id: '4',
    title: 'Family Member Offers to Interpret',
    situation: 'In a medical emergency, a patient\'s adult child says: "I can interpret for my mother, you don\'t need to stay." The provider agrees.',
    question: 'What should you do?',
    options: [
      {
        text: 'Leave to respect family autonomy',
        isCorrect: false,
        explanation: 'Family members are not qualified interpreters and may omit, add, or distort information due to emotional involvement.',
      },
      {
        text: 'Explain to the provider that qualified interpretation is required',
        isCorrect: true,
        explanation: 'Correct. Professional standards require qualified interpreters. Family interpretation risks accuracy and confidentiality.',
      },
      {
        text: 'Stay but let the family member take the lead',
        isCorrect: false,
        explanation: 'Dual interpretation creates confusion and violates the standard of having one qualified interpreter per session.',
      },
    ],
    standard: 'NAATI Code 5.1 — Professional Conduct',
    category: 'professional-conduct',
  },
  {
    id: '5',
    title: 'Cultural Context vs. Literal Translation',
    situation: 'A witness says "إن شاء الله" (Inshallah) when promising to appear in court. The attorney asks for a literal translation.',
    question: 'How do you handle this?',
    options: [
      {
        text: 'Translate literally as "God willing" and add cultural context',
        isCorrect: true,
        explanation: 'Correct. You interpret the utterance faithfully while offering a brief cultural explanation if requested, without editorializing.',
      },
      {
        text: 'Translate as "Yes, I will definitely come" to avoid confusion',
        isCorrect: false,
        explanation: 'Altering the meaning to "clarify" violates accuracy. The witness did not say "definitely."',
      },
      {
        text: 'Refuse to translate religious expressions',
        isCorrect: false,
        explanation: 'You must interpret what is said. Personal discomfort with content does not excuse omission.',
      },
    ],
    standard: 'ISITC Standard 2.3 — Cultural Competence',
    category: 'accuracy',
  },
];