import { describe, expect, it } from "vitest";

import { composeMorningNote } from "../src/domain/markdown-composer";

describe("markdown composer", () => {
  it("renders required sections for daily note", () => {
    const markdown = composeMorningNote({
      sleepAt: "22:30",
      wakeAt: "06:45",
      facts: ["[事业] 事实：推进A；进展：合并PR；证据：链接"],
      review: "做对了拆分任务",
      top3: ["完成需求文档", "完成代码评审", "30分钟有氧"]
    });

    expect(markdown).toContain("## 昨天的事实与进展（客观 + 证据）");
    expect(markdown).toContain("## 今天最重要的 3 件事（结果导向）");
    expect(markdown).toContain("## 晚间复盘");
  });
});
