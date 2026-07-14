import type { Gender, UserRole } from "../types/enums";

export interface SeedUser {
  firstName: string;
  lastName: string;
  emailId: string;
  password: string;
  role: UserRole;
  gender: Gender;
  age: number;
  about: string;
  skills: string[];
  photoUrl: string;
}

export const DEMO_PASSWORD = "Demo@12345";

export const buildAdminUser = (
  emailId: string,
  password: string,
): SeedUser => ({
  firstName: "Aashish",
  lastName: "Neupane",
  emailId,
  password,
  role: "admin",
  gender: "male",
  age: 32,
  about:
    "Platform administrator for DevCollab. Full access to user management and analytics.",
  skills: ["TypeScript", "Node.js", "MongoDB", "React", "DevOps"],
  photoUrl: "/api/uploads/aashish-neupane.jpg",
});

// Accepted (mutual) connections between demo accounts.
export const SEED_ACCEPTED: Array<[string, string]> = [
  ["aashish.neupane@devcollab.dev", "bartika.rai@devcollab.dev"],
  ["aashish.neupane@devcollab.dev", "aadarsha.bhattarai@devcollab.dev"],
  ["bartika.rai@devcollab.dev", "praniyal.thapa@devcollab.dev"],
  ["sofia.rossi@devcollab.dev", "piyush.bhattarai@devcollab.dev"],
];

// Pending requests waiting in each "to" user's Requests tab.
export const SEED_PENDING: Array<[string, string]> = [
  ["aria.nguyen@devcollab.dev", "aashish.neupane@devcollab.dev"],
  ["piyush.bhattarai@devcollab.dev", "bartika.rai@devcollab.dev"],
  ["praniyal.thapa@devcollab.dev", "aadarsha.bhattarai@devcollab.dev"],
];

// Pending requests the user has sent (shown in their Sent tab).
export const SEED_SENT: Array<[string, string]> = [
  ["aashish.neupane@devcollab.dev", "sofia.rossi@devcollab.dev"],
];

export interface SeedChatMessage {
  from: string;
  text: string;
}

export const SEED_CHATS: Array<{
  participants: [string, string];
  messages: SeedChatMessage[];
}> = [
  {
    participants: ["aashish.neupane@devcollab.dev", "bartika.rai@devcollab.dev"],
    messages: [
      { from: "bartika.rai@devcollab.dev", text: "Hi Aashish! Great to connect on DevCollab." },
      { from: "aashish.neupane@devcollab.dev", text: "Likewise Bartika! Want to pair on the matching service?" },
      { from: "bartika.rai@devcollab.dev", text: "Absolutely — let's open a code session." },
    ],
  },
];

export const demoUsers: SeedUser[] = [
  {
    firstName: "Bartika",
    lastName: "Eam Rai",
    emailId: "bartika.rai@devcollab.dev",
    password: DEMO_PASSWORD,
    role: "user",
    gender: "female",
    age: 27,
    about:
      "Full-stack engineer who enjoys building accessible interfaces and clean APIs.",
    skills: ["React", "TypeScript", "Node.js", "GraphQL", "Tailwind"],
    photoUrl: "/api/uploads/bartika-rai.jpg",
  },
  {
    firstName: "Aadarsha",
    lastName: "Bhattarai",
    emailId: "aadarsha.bhattarai@devcollab.dev",
    password: DEMO_PASSWORD,
    role: "user",
    gender: "male",
    age: 30,
    about:
      "Backend developer focused on distributed systems, queues, and observability.",
    skills: ["Go", "Node.js", "MongoDB", "Docker", "AWS"],
    photoUrl: "https://randomuser.me/api/portraits/men/68.jpg",
  },
  {
    firstName: "Sofia",
    lastName: "Rossi",
    emailId: "sofia.rossi@devcollab.dev",
    password: DEMO_PASSWORD,
    role: "user",
    gender: "female",
    age: 25,
    about: "Frontend specialist passionate about design systems and animation.",
    skills: ["React", "TypeScript", "CSS", "Tailwind", "Figma"],
    photoUrl: "https://randomuser.me/api/portraits/women/65.jpg",
  },
  {
    firstName: "Praniyal",
    lastName: "Thapa",
    emailId: "praniyal.thapa@devcollab.dev",
    password: DEMO_PASSWORD,
    role: "user",
    gender: "male",
    age: 33,
    about: "Cloud and platform engineer. Kubernetes, CI/CD, and infrastructure as code.",
    skills: ["Kubernetes", "Docker", "AWS", "Go", "TypeScript"],
    photoUrl: "https://randomuser.me/api/portraits/men/77.jpg",
  },
  {
    firstName: "Aria",
    lastName: "Nguyen",
    emailId: "aria.nguyen@devcollab.dev",
    password: DEMO_PASSWORD,
    role: "user",
    gender: "female",
    age: 29,
    about: "Data engineer who loves Python, pipelines, and turning data into products.",
    skills: ["Python", "MongoDB", "AWS", "Docker", "GraphQL"],
    photoUrl: "https://randomuser.me/api/portraits/women/12.jpg",
  },
  {
    firstName: "Piyush",
    lastName: "Bhattarai",
    emailId: "piyush.bhattarai@devcollab.dev",
    password: DEMO_PASSWORD,
    role: "user",
    gender: "male",
    age: 26,
    about: "Generalist who ships product features end to end and mentors juniors.",
    skills: ["React", "Node.js", "TypeScript", "MongoDB", "Express"],
    photoUrl: "https://randomuser.me/api/portraits/men/52.jpg",
  },
];
