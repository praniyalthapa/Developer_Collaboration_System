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
  isPremium: boolean;
}

export const DEMO_PASSWORD = "Demo@12345";

export const buildAdminUser = (
  emailId: string,
  password: string,
): SeedUser => ({
  firstName: "Ada",
  lastName: "Admin",
  emailId,
  password,
  role: "admin",
  gender: "female",
  age: 32,
  about:
    "Platform administrator for DevCollab. Full access to user management and analytics.",
  skills: ["TypeScript", "Node.js", "MongoDB", "React", "DevOps"],
  photoUrl: "https://randomuser.me/api/portraits/women/68.jpg",
  isPremium: true,
});

// Accepted (mutual) connections between demo accounts.
export const SEED_ACCEPTED: Array<[string, string]> = [
  ["admin@devcollab.dev", "maya@devcollab.dev"],
  ["admin@devcollab.dev", "liam@devcollab.dev"],
  ["maya@devcollab.dev", "noah@devcollab.dev"],
  ["sofia@devcollab.dev", "ethan@devcollab.dev"],
];

// Pending requests waiting in each "to" user's Requests tab.
export const SEED_PENDING: Array<[string, string]> = [
  ["aria@devcollab.dev", "admin@devcollab.dev"],
  ["ethan@devcollab.dev", "maya@devcollab.dev"],
  ["noah@devcollab.dev", "liam@devcollab.dev"],
];

// Pending requests the user has sent (shown in their Sent tab).
export const SEED_SENT: Array<[string, string]> = [
  ["admin@devcollab.dev", "sofia@devcollab.dev"],
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
    participants: ["admin@devcollab.dev", "maya@devcollab.dev"],
    messages: [
      { from: "maya@devcollab.dev", text: "Hi Ada! Great to connect on DevCollab." },
      { from: "admin@devcollab.dev", text: "Likewise Maya! Want to pair on the matching service?" },
      { from: "maya@devcollab.dev", text: "Absolutely — let's open a code session." },
    ],
  },
];

export const demoUsers: SeedUser[] = [
  {
    firstName: "Maya",
    lastName: "Chen",
    emailId: "maya@devcollab.dev",
    password: DEMO_PASSWORD,
    role: "user",
    gender: "female",
    age: 27,
    about:
      "Full-stack engineer who enjoys building accessible interfaces and clean APIs.",
    skills: ["React", "TypeScript", "Node.js", "GraphQL", "Tailwind"],
    photoUrl: "https://randomuser.me/api/portraits/women/44.jpg",
    isPremium: true,
  },
  {
    firstName: "Liam",
    lastName: "Patel",
    emailId: "liam@devcollab.dev",
    password: DEMO_PASSWORD,
    role: "user",
    gender: "male",
    age: 30,
    about:
      "Backend developer focused on distributed systems, queues, and observability.",
    skills: ["Go", "Node.js", "MongoDB", "Docker", "AWS"],
    photoUrl: "https://randomuser.me/api/portraits/men/32.jpg",
    isPremium: false,
  },
  {
    firstName: "Sofia",
    lastName: "Rossi",
    emailId: "sofia@devcollab.dev",
    password: DEMO_PASSWORD,
    role: "user",
    gender: "female",
    age: 25,
    about: "Frontend specialist passionate about design systems and animation.",
    skills: ["React", "TypeScript", "CSS", "Tailwind", "Figma"],
    photoUrl: "https://randomuser.me/api/portraits/women/65.jpg",
    isPremium: false,
  },
  {
    firstName: "Noah",
    lastName: "Kim",
    emailId: "noah@devcollab.dev",
    password: DEMO_PASSWORD,
    role: "user",
    gender: "male",
    age: 33,
    about: "Cloud and platform engineer. Kubernetes, CI/CD, and infrastructure as code.",
    skills: ["Kubernetes", "Docker", "AWS", "Go", "TypeScript"],
    photoUrl: "https://randomuser.me/api/portraits/men/77.jpg",
    isPremium: true,
  },
  {
    firstName: "Aria",
    lastName: "Nguyen",
    emailId: "aria@devcollab.dev",
    password: DEMO_PASSWORD,
    role: "user",
    gender: "female",
    age: 29,
    about: "Data engineer who loves Python, pipelines, and turning data into products.",
    skills: ["Python", "MongoDB", "AWS", "Docker", "GraphQL"],
    photoUrl: "https://randomuser.me/api/portraits/women/12.jpg",
    isPremium: false,
  },
  {
    firstName: "Ethan",
    lastName: "Garcia",
    emailId: "ethan@devcollab.dev",
    password: DEMO_PASSWORD,
    role: "user",
    gender: "male",
    age: 26,
    about: "Generalist who ships product features end to end and mentors juniors.",
    skills: ["React", "Node.js", "TypeScript", "MongoDB", "Express"],
    photoUrl: "https://randomuser.me/api/portraits/men/52.jpg",
    isPremium: false,
  },
];
