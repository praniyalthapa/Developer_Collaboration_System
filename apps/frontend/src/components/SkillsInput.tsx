import { useMemo, useState, type KeyboardEvent } from "react";

interface SkillsInputProps {
  skills: string[];
  onChange: (skills: string[]) => void;
}

const SUGGESTED_SKILLS = [
  "React",
  "Node.js",
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "Go",
  "Rust",
  "Next.js",
  "Express",
  "MongoDB",
  "PostgreSQL",
  "AWS",
  "Docker",
  "Kubernetes",
  "GraphQL",
  "Tailwind",
  "Figma",
  "DevOps",
  "Testing",
];

export const SkillsInput = ({ skills, onChange }: SkillsInputProps) => {
  const [value, setValue] = useState("");

  const suggestions = useMemo(() => {
    if (!value.trim()) return [];
    const query = value.toLowerCase();
    return SUGGESTED_SKILLS.filter(
      (skill) =>
        skill.toLowerCase().includes(query) && !skills.includes(skill),
    ).slice(0, 6);
  }, [value, skills]);

  const addSkill = (raw: string) => {
    const skill = raw.trim();
    if (skill && !skills.includes(skill)) {
      onChange([...skills, skill]);
    }
    setValue("");
  };

  const removeSkill = (skill: string) => {
    onChange(skills.filter((item) => item !== skill));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addSkill(value);
    } else if (event.key === "Backspace" && value === "" && skills.length > 0) {
      onChange(skills.slice(0, -1));
    }
  };

  return (
    <div className="form-control">
      <label className="label">
        <span className="label-text font-medium">Skills</span>
        <span className="label-text-alt">{skills.length} added</span>
      </label>

      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          className="input input-bordered w-full"
          placeholder="Type a skill and press Enter"
        />
        {suggestions.length > 0 ? (
          <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-lg">
            {suggestions.map((skill) => (
              <li key={skill}>
                <button
                  type="button"
                  className="w-full px-4 py-2 text-left text-sm hover:bg-base-200"
                  onClick={() => addSkill(skill)}
                >
                  {skill}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {skills.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <button
              key={skill}
              type="button"
              className="badge badge-primary badge-lg gap-1"
              onClick={() => removeSkill(skill)}
              title="Remove skill"
            >
              {skill}
              <span aria-hidden>×</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};
