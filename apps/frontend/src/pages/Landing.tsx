import { Link } from "react-router-dom";
import { useAppSelector } from "../app/hooks";

const FEATURES = [
  {
    title: "Skill-based matching",
    description:
      "Get ranked matches with developers whose stack complements yours.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
  },
  {
    title: "Real-time chat",
    description: "Message connections instantly with live, socket-powered chat.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    ),
  },
  {
    title: "Pair programming",
    description: "Jump into a shared, real-time editor and build together.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    ),
  },
];

const STATS = [
  { label: "Match accuracy", value: "Skill-ranked" },
  { label: "Latency", value: "Real-time" },
  { label: "Editor", value: "Shared" },
];

const Landing = () => {
  const user = useAppSelector((state) => state.user);

  return (
    <div className="flex flex-col gap-20">
      <section className="grid items-center gap-12 pt-6 lg:grid-cols-2">
        <div className="animate-fade-up space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <span className="h-2 w-2 rounded-full bg-primary" />
            The developer collaboration network
          </span>
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            Find your next <span className="gradient-text">collaborator</span>,
            then build together.
          </h1>
          <p className="max-w-xl text-lg text-base-content/70">
            DevCollab matches you with developers by skill, lets you chat in real
            time, and drops you into a shared editor to pair-program — all in one
            place.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link to={user ? "/feed" : "/login"} className="btn btn-brand btn-lg px-7">
              {user ? "Go to feed" : "Get started free"}
            </Link>
            <Link to="/login" className="btn btn-ghost btn-lg border border-base-content/15">
              Sign in
            </Link>
          </div>
          <div className="flex flex-wrap gap-8 pt-4">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-sm text-base-content/55">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="animate-fade-up [animation-delay:0.15s]">
          <div className="surface relative overflow-hidden p-6">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-indigo-600" />
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-indigo-600" />
              <div className="flex-1">
                <div className="h-3 w-32 rounded bg-base-content/15" />
                <div className="mt-2 h-2.5 w-20 rounded bg-base-content/10" />
              </div>
              <span className="badge badge-success badge-sm">87% match</span>
            </div>
            <div className="mt-5 space-y-2">
              <div className="h-2.5 w-full rounded bg-base-content/10" />
              <div className="h-2.5 w-4/5 rounded bg-base-content/10" />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {["React", "TypeScript", "Node.js", "GraphQL"].map((skill) => (
                <span key={skill} className="skill-chip">
                  {skill}
                </span>
              ))}
            </div>
            <div className="mt-6 flex gap-2.5">
              <div className="btn btn-ghost btn-sm flex-1 border border-base-content/15">Pass</div>
              <div className="btn btn-brand btn-sm flex-1">Connect</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="surface surface-hover p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {feature.icon}
              </svg>
            </div>
            <h3 className="text-lg font-semibold">{feature.title}</h3>
            <p className="mt-2 text-sm text-base-content/70">{feature.description}</p>
          </div>
        ))}
      </section>
    </div>
  );
};

export default Landing;
