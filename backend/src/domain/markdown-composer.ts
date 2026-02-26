import { DAILY_NOTE_SECTION_TITLES } from "../prompts/daily-note-sections";

export type MorningNoteInput = {
  sleepAt: string;
  wakeAt: string;
  facts: string[];
  review: string;
  top3: string[];
};

export function composeMorningNote(input: MorningNoteInput): string {
  const factsLines = input.facts.length > 0 ? input.facts : ["- 无"];
  const top3Lines = [0, 1, 2].map((index) => {
    const content = input.top3[index] ?? "待补充";
    return `${index + 1}. [ ] 结果：${content}\n   完成标准：\n   最晚时间：`;
  });

  return `---
sleep_at: ${input.sleepAt}
wake_at: ${input.wakeAt}
---

${DAILY_NOTE_SECTION_TITLES.sleep}
- 入睡时间：${input.sleepAt}
- 起床时间：${input.wakeAt}

${DAILY_NOTE_SECTION_TITLES.facts}
${factsLines.map((line) => `- ${line.replace(/^-\s*/, "")}`).join("\n")}

${DAILY_NOTE_SECTION_TITLES.review}
- ${input.review || "待补充"}

${DAILY_NOTE_SECTION_TITLES.top3}
${top3Lines.join("\n")}

${DAILY_NOTE_SECTION_TITLES.evening}
- 完成率（0-100）：
- 未完成项根因（1 条）：
- 明天第一步（10 分钟可启动）：
- 今日一句话总结：
`;
}
