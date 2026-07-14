// Skill-vector similarity for the discovery feed / smart-matches.
// Pure functions — no I/O, no database, no external algorithm libraries.

const toSkillSet = (skills: readonly string[]): Set<string> =>
  new Set(skills.map((skill) => skill.trim().toLowerCase()).filter(Boolean));

/**
 * Cosine similarity of two skill lists treated as binary vectors over the union
 * of all skills (a component is 1 when the skill is present, 0 otherwise).
 *
 * For binary vectors the dot product equals the number of shared skills and each
 * vector's magnitude is sqrt(numberOfSkills), so the cosine reduces to
 * `|A ∩ B| / (sqrt(|A|) * sqrt(|B|))`.
 *
 * Comparison is case-insensitive and duplicates within a list are ignored.
 * Returns a value in [0, 1]; 0 when either list is empty.
 */
export const cosineSimilarity = (
  a: readonly string[],
  b: readonly string[],
): number => {
  const setA = toSkillSet(a);
  const setB = toSkillSet(b);
  if (setA.size === 0 || setB.size === 0) return 0;

  let shared = 0;
  for (const skill of setA) {
    if (setB.has(skill)) shared += 1;
  }
  // sqrt(|A| * |B|) rather than sqrt(|A|) * sqrt(|B|): mathematically identical
  // but numerically stable, so identical sets return exactly 1.
  return shared / Math.sqrt(setA.size * setB.size);
};

export interface SkillRanked<T> {
  item: T;
  similarity: number;
  sharedSkills: string[];
}

/**
 * Rank candidates by cosine similarity of their skills to the target's skills,
 * most similar first. Sorting is stable, so equal-similarity candidates keep
 * their input order. Each result carries its similarity score and the concrete
 * skills it shares with the target (in the candidate's original casing).
 */
export const rankBySkillSimilarity = <T>(
  targetSkills: readonly string[],
  candidates: readonly T[],
  getSkills: (candidate: T) => readonly string[],
): SkillRanked<T>[] => {
  const targetSet = toSkillSet(targetSkills);
  return candidates
    .map((item) => {
      const skills = getSkills(item);
      return {
        item,
        similarity: cosineSimilarity(targetSkills, skills),
        sharedSkills: skills.filter((skill) =>
          targetSet.has(skill.trim().toLowerCase()),
        ),
      };
    })
    .sort((x, y) => y.similarity - x.similarity);
};
