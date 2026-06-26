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
    name: "Ada Admin",
    email: "admin@devcollab.dev",
    password: "Admin@12345",
    role: "admin",
    tagline: "Full administrative access",
    photoUrl: "https://randomuser.me/api/portraits/women/68.jpg",
  },
  {
    name: "Maya Chen",
    email: "maya@devcollab.dev",
    password: "Demo@12345",
    role: "user",
    tagline: "Full-stack engineer",
    photoUrl: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    name: "Liam Patel",
    email: "liam@devcollab.dev",
    password: "Demo@12345",
    role: "user",
    tagline: "Backend developer",
    photoUrl: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    name: "Noah Kim",
    email: "noah@devcollab.dev",
    password: "Demo@12345",
    role: "user",
    tagline: "Cloud and platform engineer",
    photoUrl: "https://randomuser.me/api/portraits/men/77.jpg",
  },
];
