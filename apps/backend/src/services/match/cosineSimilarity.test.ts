import { describe, it, expect } from "vitest";
import { cosineSimilarity, rankBySkillSimilarity } from "./cosineSimilarity";

describe("cosineSimilarity", () => {
  it("is 1 for identical skill sets", () => {
    expect(cosineSimilarity(["react", "node"], ["react", "node"])).toBe(1);
  });

  it("is 0 for disjoint skill sets", () => {
    expect(cosineSimilarity(["react"], ["python"])).toBe(0);
  });

  it("is 0 when either list is empty", () => {
    expect(cosineSimilarity([], ["react"])).toBe(0);
    expect(cosineSimilarity(["react"], [])).toBe(0);
    expect(cosineSimilarity([], [])).toBe(0);
  });

  it("computes the known value |A∩B| / (sqrt|A| * sqrt|B|)", () => {
    // shared = 1, |A| = 2, |B| = 1 -> 1 / (sqrt(2) * 1) ≈ 0.7071
    expect(cosineSimilarity(["react", "node"], ["react"])).toBeCloseTo(0.7071, 4);
  });

  it("is symmetric", () => {
    const a = ["a", "b", "c"];
    const b = ["b", "c", "d"];
    expect(cosineSimilarity(a, b)).toBeCloseTo(cosineSimilarity(b, a), 12);
  });

  it("is case-insensitive and ignores duplicates and blanks", () => {
    expect(cosineSimilarity(["React", "react", " NODE "], ["node", "REACT"])).toBe(1);
  });

  it("ranks partial overlaps between 0 and 1", () => {
    const score = cosineSimilarity(["a", "b", "c", "d"], ["a", "b"]);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });
});

describe("rankBySkillSimilarity", () => {
  interface Dev {
    id: string;
    skills: string[];
  }
  const target = ["react", "typescript", "node"];
  const devs: Dev[] = [
    { id: "exact", skills: ["react", "typescript", "node"] },
    { id: "partial", skills: ["react", "typescript"] },
    { id: "none", skills: ["rust", "cpp"] },
    { id: "one", skills: ["node", "go"] },
  ];

  it("orders candidates by similarity, most similar first", () => {
    const ranked = rankBySkillSimilarity(target, devs, (d) => d.skills);
    expect(ranked.map((r) => r.item.id)).toEqual(["exact", "partial", "one", "none"]);
    expect(ranked[0].similarity).toBe(1);
    expect(ranked[ranked.length - 1].similarity).toBe(0);
  });

  it("reports the concrete shared skills in candidate casing", () => {
    const ranked = rankBySkillSimilarity(target, [{ id: "x", skills: ["React", "Go"] }], (d) => d.skills);
    expect(ranked[0].sharedSkills).toEqual(["React"]);
  });

  it("keeps input order for equal similarity (stable sort)", () => {
    const tied: Dev[] = [
      { id: "first", skills: ["react"] },
      { id: "second", skills: ["react"] },
    ];
    const ranked = rankBySkillSimilarity(["react"], tied, (d) => d.skills);
    expect(ranked.map((r) => r.item.id)).toEqual(["first", "second"]);
  });

  it("returns an empty array for no candidates", () => {
    expect(rankBySkillSimilarity(target, [], (d: Dev) => d.skills)).toEqual([]);
  });
});
