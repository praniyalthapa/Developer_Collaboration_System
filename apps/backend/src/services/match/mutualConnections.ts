// Friend-of-friend suggestions via breadth-first traversal of the connection
// graph. Pure functions — operate on an in-memory graph, no I/O or libraries.

export type ConnectionGraph = Map<string, Set<string>>;

/**
 * Build an undirected adjacency map from a list of accepted-connection pairs.
 * Self-loops are ignored; duplicate edges collapse.
 */
export const buildConnectionGraph = (
  edges: ReadonlyArray<readonly [string, string]>,
): ConnectionGraph => {
  const graph: ConnectionGraph = new Map();
  const link = (from: string, to: string): void => {
    const neighbors = graph.get(from) ?? new Set<string>();
    neighbors.add(to);
    graph.set(from, neighbors);
  };
  for (const [a, b] of edges) {
    if (a === b) continue;
    link(a, b);
    link(b, a);
  }
  return graph;
};

export interface MutualSuggestion {
  userId: string;
  mutualCount: number;
  mutualConnections: string[];
}

/**
 * Suggest new connections for `sourceId` by BFS to depth 2.
 *
 * Depth 1 is the source's existing connections (never suggested). Depth 2 is the
 * candidate pool: friends-of-friends who are not the source and not already
 * connected to it. Each candidate is ranked by the number of mutual connections
 * it shares with the source (descending), breaking ties by userId for a stable,
 * deterministic order.
 */
export const suggestByMutualConnections = (
  graph: ConnectionGraph,
  sourceId: string,
): MutualSuggestion[] => {
  const direct = graph.get(sourceId) ?? new Set<string>();

  // Breadth-first traversal with explicit depth tracking, stopping at depth 2.
  const visited = new Set<string>([sourceId]);
  const candidates = new Set<string>();
  let frontier: string[] = [sourceId];

  for (let depth = 1; depth <= 2; depth += 1) {
    const nextFrontier: string[] = [];
    for (const node of frontier) {
      for (const neighbor of graph.get(node) ?? []) {
        if (visited.has(neighbor)) continue;
        visited.add(neighbor);
        nextFrontier.push(neighbor);
        // A depth-2 node that isn't already a direct connection is a candidate.
        if (depth === 2 && !direct.has(neighbor)) {
          candidates.add(neighbor);
        }
      }
    }
    frontier = nextFrontier;
  }

  return [...candidates]
    .map((userId) => {
      const theirConnections = graph.get(userId) ?? new Set<string>();
      const mutualConnections = [...direct].filter((id) =>
        theirConnections.has(id),
      );
      return {
        userId,
        mutualCount: mutualConnections.length,
        mutualConnections,
      };
    })
    .filter((suggestion) => suggestion.mutualCount > 0)
    .sort(
      (a, b) =>
        b.mutualCount - a.mutualCount || a.userId.localeCompare(b.userId),
    );
};
