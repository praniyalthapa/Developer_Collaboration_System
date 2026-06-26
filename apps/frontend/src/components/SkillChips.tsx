interface SkillChipsProps {
  skills: string[];
  mySkills?: string[];
  max?: number;
}

export const SkillChips = ({ skills, mySkills = [], max = 5 }: SkillChipsProps) => {
  if (skills.length === 0) return null;
  const shared = new Set(mySkills.map((skill) => skill.toLowerCase()));
  const shown = skills.slice(0, max);

  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((skill) =>
        shared.has(skill.toLowerCase()) ? (
          <span
            key={skill}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-0.5 font-mono text-[11px] font-semibold text-primary-content"
            title="Shared skill"
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
            </svg>
            {skill}
          </span>
        ) : (
          <span key={skill} className="skill-chip">
            {skill}
          </span>
        ),
      )}
      {skills.length > max ? (
        <span className="skill-chip">+{skills.length - max}</span>
      ) : null}
    </div>
  );
};
