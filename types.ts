export enum ChallengeMode {
  FILL_GAPS = 'FILL_GAPS',
  WRITE_FULL = 'WRITE_FULL',
}

export interface Challenge {
  id: string;
  topic: string;
  question: string;
  description: string;
  codeWithGaps: string; // Contains __GAP__ placeholders
  fullSolution: string;
  expectedGaps: string[]; // The correct answers for the gaps
  explanation: string;
}

export interface GameState {
  status: 'LANDING' | 'LOADING' | 'PLAYING' | 'RESULT';
  topic: string;
  mode: ChallengeMode;
  challenges: Challenge[];
  currentIndex: number;
  hearts: number;
  xp: number;
  streak: number;
  isCorrect: boolean | null; // For immediate feedback state
  userAnswers: string[]; // Current answers for the current challenge
}

export interface GeminiChallengeResponse {
  challenges: Array<{
    question: string;
    description: string;
    code_with_gaps: string;
    full_solution: string;
    gap_answers: string[];
    explanation: string;
  }>;
}