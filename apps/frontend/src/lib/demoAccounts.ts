import type { UserRole } from "../types/models";

export interface DemoAccount {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  tagline: string;
  photoUrl: string;
}

// Mirrors apps/backend/src/seed/data.ts
export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    name: "Aashish Neupane",
    email: "aashish.neupane@devcollab.dev",
    password: "Admin@12345",
    role: "admin",
    tagline: "Full administrative access",
    photoUrl: "/api/uploads/aashish-neupane.jpg",
  },
  {
    name: "Bartika Eam Rai",
    email: "bartika.rai@devcollab.dev",
    password: "Demo@12345",
    role: "user",
    tagline: "Full-stack engineer",
    photoUrl: "/api/uploads/bartika-rai.jpg",
  },
  {
    name: "Aadarsha Bhattarai",
    email: "aadarsha.bhattarai@devcollab.dev",
    password: "Demo@12345",
    role: "user",
    tagline: "Backend developer",
    photoUrl: "https://randomuser.me/api/portraits/men/68.jpg",
  },
  {
    name: "Praniyal Thapa",
    email: "praniyal.thapa@devcollab.dev",
    password: "Demo@12345",
    role: "user",
    tagline: "Cloud and platform engineer",
    photoUrl: "https://randomuser.me/api/portraits/men/77.jpg",
  },
  {
    name: "Piyush Bhattarai",
    email: "piyush.bhattarai@devcollab.dev",
    password: "Demo@12345",
    role: "user",
    tagline: "Full-stack generalist",
    photoUrl: "https://randomuser.me/api/portraits/men/52.jpg",
  },
];
