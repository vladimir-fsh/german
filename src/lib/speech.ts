export type SpeechResults = { length: number; [index: number]: { isFinal?: boolean; 0?: { transcript: string } } };
// Recognition events contain cumulative results. Rebuild this session, never append the whole list again.
export function recognitionText(base: string, results: SpeechResults) {
  const final: string[] = []; const interim: string[] = [];
  for (let index = 0; index < results.length; index += 1) { const result = results[index]; const text = result?.[0]?.transcript ?? ""; (result?.isFinal ? final : interim).push(text); }
  return { transcript: [base, ...final].filter(Boolean).join(" ").trim(), interim: interim.join(" ").trim() };
}
