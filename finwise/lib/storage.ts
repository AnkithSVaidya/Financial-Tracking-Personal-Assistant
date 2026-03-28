import { UserProfile, CategoryBudget, ProductAnalysis, CATEGORIES } from "./types";

const KEY = "finwise_profile";

export function getProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(KEY, JSON.stringify(profile));
}

export function clearProfile(): void {
  localStorage.removeItem(KEY);
}

export function createDefaultProfile(
  name: string,
  monthlySalary: number,
  monthlySavingsGoal: number
): UserProfile {
  const categories: CategoryBudget[] = CATEGORIES.map((c) => ({
    id: c.id,
    label: c.label,
    icon: c.icon,
    monthlyBudget: 0,
    currentSpent: 0,
  }));

  return {
    name,
    monthlySalary,
    monthlySavingsGoal,
    categories,
    preferences: {
      priorityCategory: "experiences",
      spendingStyle: "moderate",
      maxSinglePurchase: 200,
      financialGoal: "saving",
    },
    setupComplete: false,
    analyses: [],
  };
}

export function addAnalysis(analysis: ProductAnalysis): void {
  const profile = getProfile();
  if (!profile) return;
  profile.analyses = [analysis, ...profile.analyses].slice(0, 20);
  saveProfile(profile);
}
