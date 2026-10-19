import type { Plan } from "@/types/saas";
import { api } from "@/lib/api";

/** Plans on offer (pricing page, sign-up, billing). */
export const listPlans = () => api.get<Plan[]>("/plans", undefined, { auth: false });
