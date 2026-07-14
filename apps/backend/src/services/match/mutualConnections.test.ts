import { describe, it, expect } from "vitest";
import {
  buildConnectionGraph,
  suggestByMutualConnections,
} from "./mutualConnections";

describe("buildConnectionGraph", () => {
  it("builds an undirected graph from edges", () => {
    const graph = buildConnectionGraph([["a", "b"]]);
    expect(graph.get("a")).toEqual(new Set(["b"]));
    expect(graph.get("b")).toEqual(new Set(["a"]));
  });

  it("ignores self-loops and collapses duplicate edges", () => {
    const graph = buildConnectionGraph([
      ["a", "a"],
      ["a", "b"],
      ["b", "a"],
    ]);
    expect(graph.get("a")).toEqual(new Set(["b"]));
    expect(graph.get("b")).toEqual(new Set(["a"]));
  });
});

describe("suggestByMutualConnections", () => {
  it("suggests a friend-of-friend ranked by mutual count", () => {
    //   A - B - D
    //   A - C - D    (D is two hops from A, via both B and C)
    const graph = buildConnectionGraph([
      ["A", "B"],
      ["A", "C"],
      ["B", "D"],
      ["C", "D"],
    ]);
    const suggestions = suggestByMutualConnections(graph, "A");
    expect(suggestions).toEqual([
      { userId: "D", mutualCount: 2, mutualConnections: ["B", "C"] },
    ]);
  });

  it("never suggests the source or its existing connections", () => {
    const graph = buildConnectionGraph([
      ["A", "B"],
      ["A", "C"],
      ["B", "C"], // C is already connected to A, so must not be suggested
      ["B", "D"],
    ]);
    const ids = suggestByMutualConnections(graph, "A").map((s) => s.userId);
    expect(ids).not.toContain("A");
    expect(ids).not.toContain("B");
    expect(ids).not.toContain("C");
    expect(ids).toContain("D");
  });

  it("ranks by mutual count desc, then userId for ties", () => {
    // A connects to B, C. Candidates:
    //   X shares B and C (2 mutuals), Y shares only B (1), Z shares only C (1)
    const graph = buildConnectionGraph([
      ["A", "B"],
      ["A", "C"],
      ["B", "X"],
      ["C", "X"],
      ["B", "Y"],
      ["C", "Z"],
    ]);
    const suggestions = suggestByMutualConnections(graph, "A");
    expect(suggestions.map((s) => s.userId)).toEqual(["X", "Y", "Z"]);
    expect(suggestions[0].mutualCount).toBe(2);
  });

  it("does not traverse beyond depth 2", () => {
    // A - B - C - E : E is three hops away and must not appear.
    const graph = buildConnectionGraph([
      ["A", "B"],
      ["B", "C"],
      ["C", "E"],
    ]);
    const ids = suggestByMutualConnections(graph, "A").map((s) => s.userId);
    expect(ids).toContain("C"); // depth 2
    expect(ids).not.toContain("E"); // depth 3
  });

  it("returns an empty array when the source has no connections", () => {
    const graph = buildConnectionGraph([["B", "C"]]);
    expect(suggestByMutualConnections(graph, "A")).toEqual([]);
  });
});
