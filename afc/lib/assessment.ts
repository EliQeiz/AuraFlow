export type Question = {
  id: string;
  prompt: string;
  options: string[];
  correct: number;
};
export function grade(questions: Question[], answers: Record<string, number>) {
  if (!questions.length)
    throw new Error('An assessment needs at least one question.');
  return Math.round(
    (100 * questions.filter((q) => answers[q.id] === q.correct).length) /
      questions.length,
  );
}
export function publicQuestions(questions: Question[]) {
  return questions.map(({ id, prompt, options }) => ({ id, prompt, options }));
}
export function shuffleQuestions(questions: Question[]) {
  const randomIndex = (max: number) => {
    const limit = Math.floor(0x100000000 / max) * max;
    let value;
    do {
      value = crypto.getRandomValues(new Uint32Array(1))[0];
    } while (value >= limit);
    return value % max;
  };
  const shuffle = <T>(values: T[]) => {
    const out = [...values];
    for (let i = out.length - 1; i > 0; i--) {
      const j = randomIndex(i + 1);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };
  return shuffle(questions).map((q) => {
    const options = shuffle(q.options.map((text, index) => ({ text, index })));
    return {
      ...q,
      options: options.map((o) => o.text),
      correct: options.findIndex((o) => o.index === q.correct),
    };
  });
}
export function validateQuestions(value: unknown): Question[] {
  if (!Array.isArray(value) || !value.length || value.length > 100)
    throw new Error('Add between 1 and 100 questions.');
  return value.map((q, i) => {
    if (
      typeof q?.prompt !== 'string' ||
      !q.prompt.trim() ||
      q.prompt.length > 4000 ||
      !Array.isArray(q.options) ||
      q.options.length < 2 ||
      q.options.length > 6 ||
      q.options.some(
        (o: unknown) => typeof o !== 'string' || !o.trim() || o.length > 1000,
      ) ||
      !Number.isInteger(q.correct) ||
      q.correct < 0 ||
      q.correct >= q.options.length
    )
      throw new Error(
        `Question ${i + 1} needs a prompt, options, and a correct answer.`,
      );
    return {
      id: crypto.randomUUID(),
      prompt: q.prompt.trim(),
      options: q.options.map((o: string) => o.trim()),
      correct: q.correct,
    };
  });
}
