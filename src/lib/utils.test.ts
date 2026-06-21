import { describe, it, expect } from "vitest";
import {
  toDateKey,
  toMarkdownFilename,
  parseMarkdownFilename,
  countWords,
  generateId,
} from "@/lib/utils";
import { parseImportedMarkdown } from "@/lib/markdown/export";
import { sanitizeTags, sanitizeText } from "@/lib/security/sanitize";

describe("utils", () => {
  it("formats date keys", () => {
    const date = new Date("2025-05-22T12:00:00");
    expect(toDateKey(date)).toBe("2025-05-22");
  });

  it("formats markdown filenames", () => {
    const date = new Date("2025-04-22T12:00:00");
    expect(toMarkdownFilename(date)).toBe("22_04_2025.md");
  });

  it("parses markdown filenames", () => {
    const date = parseMarkdownFilename("22_04_2025.md");
    expect(date).not.toBeNull();
    expect(date!.getDate()).toBe(22);
    expect(date!.getMonth()).toBe(3);
    expect(date!.getFullYear()).toBe(2025);
  });

  it("counts words", () => {
    expect(countWords("hello world")).toBe(2);
    expect(countWords("")).toBe(0);
  });

  it("generates unique ids", () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });
});

describe("sanitize", () => {
  it("sanitizes tags", () => {
    expect(sanitizeTags(["#Work", " personal ", ""])).toEqual(["work", "personal"]);
  });

  it("sanitizes text", () => {
    expect(sanitizeText("<script>alert</script>")).toBe("scriptalert/script");
  });
});

describe("markdown export", () => {
  it("parses imported markdown", () => {
    const content = `# Daily Notes

## Project Ideas

Some content here

Tags:
#work #ideas

---

## Shopping List

Milk and eggs

Tags:
#personal
`;

    const notes = parseImportedMarkdown(content, new Date("2025-04-22"));
    expect(notes).toHaveLength(2);
    expect(notes[0].title).toBe("Project Ideas");
    expect(notes[0].tags).toEqual(["work", "ideas"]);
    expect(notes[1].title).toBe("Shopping List");
  });
});
