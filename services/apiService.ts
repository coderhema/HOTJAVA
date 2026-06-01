import { Challenge, SessionResultPayload, SessionStartResponse } from '../types';

interface StartSessionInput {
  topic: string;
  roomCode: string;
  mode: string;
  sessionType: 'HOST' | 'JOIN';
}

const parseChallenges = (items: Challenge[]): Challenge[] =>
  items.map((challenge) => ({
    ...challenge,
    expectedGaps: Array.isArray(challenge.expectedGaps) ? challenge.expectedGaps : [],
  }));

export const startSession = async (input: StartSessionInput): Promise<SessionStartResponse> => {
  const response = await fetch('/api/sessions/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...input, challengeCount: 5 }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Session start failed (${response.status}): ${text}`);
  }

  const payload = await response.json();
  return {
    ...payload,
    challenges: parseChallenges(payload.challenges || []),
  };
};

export const submitSessionResult = async (sessionId: string, userId: string, result: SessionResultPayload): Promise<void> => {
  const response = await fetch(`/api/sessions/${sessionId}/result`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...result }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Submit result failed (${response.status}): ${text}`);
  }
};

export const logClientEvent = async (payload: {
  sessionId?: string | null;
  userId?: string | null;
  level?: 'info' | 'warn' | 'error';
  eventType: string;
  message: string;
  metadata?: Record<string, unknown>;
}): Promise<void> => {
  const response = await fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Log event failed (${response.status}): ${text}`);
  }
};
