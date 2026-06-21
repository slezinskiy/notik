import { describe, it, expect } from "vitest";
import { normalizeNote, normalizeNotes } from "@/lib/notes/normalize";

describe("normalizeNote", () => {
  it("normalizes valid note", () => {
    const note = normalizeNote({
      id: "1",
      title: "Test",
      content: "Body",
      tags: ["work"],
      noteDate: "2025-04-22T00:00:00.000Z",
      createdAt: "2025-04-22T10:00:00.000Z",
      updatedAt: "2025-04-22T10:00:00.000Z",
    });

    expect(note.title).toBe("Test");
    expect(note.tags).toEqual(["work"]);
    expect(note.noteDate).toBeInstanceOf(Date);
  });

  it("handles missing tags and invalid dates", () => {
    const note = normalizeNote({
      id: "2",
      title: "Broken",
      noteDate: "invalid",
    });

    expect(note.tags).toEqual([]);
    expect(note.content).toBe("");
    expect(note.noteDate).toBeInstanceOf(Date);
    expect(Number.isNaN(note.noteDate.getTime())).toBe(false);
  });

  it("returns empty array for non-array input", () => {
    expect(normalizeNotes(null)).toEqual([]);
    expect(normalizeNotes({ error: "Offline" })).toEqual([]);
  });
});
