import type { AdminRole } from "@/models/admin";

export type SafeAdmin = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
};
