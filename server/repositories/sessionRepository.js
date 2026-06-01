import { all, get, run, transaction } from '../db/client.js';

export const createUser = ({ id, name }) => {
  run('INSERT OR IGNORE INTO users (id, name) VALUES (@id, @name);', { id, name });
  return get('SELECT id, name, created_at FROM users WHERE id = @id;', { id });
};

export const findSession = ({ roomCode, topic }) =>
  get(
    'SELECT id, room_code, topic, mode, status, host_user_id, created_at, updated_at FROM sessions WHERE room_code = @roomCode AND topic = @topic ORDER BY created_at DESC LIMIT 1;',
    { roomCode, topic },
  );

export const createSession = ({ id, roomCode, topic, mode, hostUserId }) => {
  run(
    `INSERT INTO sessions (id, room_code, topic, mode, host_user_id)
     VALUES (@id, @roomCode, @topic, @mode, @hostUserId);`,
    { id, roomCode, topic, mode, hostUserId },
  );
  return get('SELECT * FROM sessions WHERE id = @id;', { id });
};

export const replaceSessionChallenges = ({ sessionId, challenges }) => {
  const write = transaction((items) => {
    run('DELETE FROM session_challenges WHERE session_id = @sessionId;', { sessionId });

    items.forEach((challenge, index) => {
      run(
        `INSERT INTO challenges
          (id, topic, question, description, code_with_gaps, full_solution, gap_answers_json, explanation)
         VALUES
          (@id, @topic, @question, @description, @codeWithGaps, @fullSolution, @gapAnswersJson, @explanation)
         ON CONFLICT(id) DO UPDATE SET
          topic = excluded.topic,
          question = excluded.question,
          description = excluded.description,
          code_with_gaps = excluded.code_with_gaps,
          full_solution = excluded.full_solution,
          gap_answers_json = excluded.gap_answers_json,
          explanation = excluded.explanation;`,
        {
          id: challenge.id,
          topic: challenge.topic,
          question: challenge.question,
          description: challenge.description,
          codeWithGaps: challenge.codeWithGaps,
          fullSolution: challenge.fullSolution,
          gapAnswersJson: JSON.stringify(challenge.expectedGaps),
          explanation: challenge.explanation,
        },
      );

      run(
        `INSERT INTO session_challenges (id, session_id, challenge_id, challenge_order)
         VALUES (@id, @sessionId, @challengeId, @challengeOrder);`,
        {
          id: crypto.randomUUID(),
          sessionId,
          challengeId: challenge.id,
          challengeOrder: index,
        },
      );
    });
  });

  write(challenges);
};

export const getSessionChallenges = (sessionId) =>
  all(
    `SELECT c.id, c.topic, c.question, c.description, c.code_with_gaps, c.full_solution, c.gap_answers_json, c.explanation
     FROM session_challenges sc
     INNER JOIN challenges c ON c.id = sc.challenge_id
     WHERE sc.session_id = @sessionId
     ORDER BY sc.challenge_order ASC;`,
    { sessionId },
  ).map((row) => ({
    id: row.id,
    topic: row.topic,
    question: row.question,
    description: row.description,
    codeWithGaps: row.code_with_gaps,
    fullSolution: row.full_solution,
    expectedGaps: JSON.parse(row.gap_answers_json),
    explanation: row.explanation,
  }));

export const saveResult = ({ id, sessionId, userId, xp, heartsRemaining, correctAnswers, totalAnswers, streakMax }) => {
  run(
    `INSERT INTO results
      (id, session_id, user_id, xp, hearts_remaining, correct_answers, total_answers, streak_max)
     VALUES
      (@id, @sessionId, @userId, @xp, @heartsRemaining, @correctAnswers, @totalAnswers, @streakMax);`,
    { id, sessionId, userId, xp, heartsRemaining, correctAnswers, totalAnswers, streakMax },
  );
};

export const saveEvent = ({ id, sessionId, userId, level, eventType, message, metadataJson }) => {
  run(
    `INSERT INTO event_logs (id, session_id, user_id, level, event_type, message, metadata_json)
     VALUES (@id, @sessionId, @userId, @level, @eventType, @message, @metadataJson);`,
    { id, sessionId, userId, level, eventType, message, metadataJson },
  );
};

export const getSessionSummary = (sessionId) => {
  const row = get(
    `SELECT
      s.id,
      s.room_code,
      s.topic,
      s.mode,
      s.status,
      COUNT(DISTINCT sc.challenge_id) AS challenge_count,
      COUNT(DISTINCT r.id) AS result_count
     FROM sessions s
     LEFT JOIN session_challenges sc ON sc.session_id = s.id
     LEFT JOIN results r ON r.session_id = s.id
     WHERE s.id = @sessionId
     GROUP BY s.id;`,
    { sessionId },
  );

  return row || null;
};
