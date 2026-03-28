export const CATEGORIES = [
  { id: "food_dining", label: "Food & Dining", icon: "🍔" },
  { id: "groceries", label: "Groceries", icon: "🛒" },
  { id: "clothing", label: "Clothing & Fashion", icon: "👗" },
  { id: "travel", label: "Travel", icon: "✈️" },
  { id: "experiences", label: "Experiences & Entertainment", icon: "🎉" },
  { id: "electronics", label: "Electronics", icon: "💻" },
  { id: "home_furniture", label: "Home & Furniture", icon: "🏠" },
  { id: "health_wellness", label: "Health & Wellness", icon: "💊" },
  { id: "gifts", label: "Gifts & Occasions", icon: "🎁" },
  { id: "subscriptions", label: "Subscriptions & Services", icon: "📱" },
] as const;

export type CategoryId = typeof CATEGORIES[number]["id"];

export interface CategoryBudget {
  id: CategoryId;
  label: string;
  icon: string;
  monthlyBudget: number;
  currentSpent: number;
}

export interface UserPreferences {
  priorityCategory: CategoryId;
  spendingStyle: "disciplined" | "moderate" | "spontaneous";
  maxSinglePurchase: number;
  financialGoal: "saving" | "expenses" | "debt" | "big_purchase";
}

export interface UserProfile {
  name: string;
  monthlySalary: number;
  monthlySavingsGoal: number;
  categories: CategoryBudget[];
  preferences: UserPreferences;
  setupComplete: boolean;
  analyses: ProductAnalysis[];
}

export interface ProductInfo {
  productName: string;
  price: number | null;
  currency: string;
  description: string;
  category: CategoryId | "other";
  imageUrl?: string | null;
  brand?: string;
  missingInfo?: string[];
}

export interface FinancialVerdict {
  recommendation: "buy" | "consider" | "dont_buy";
  confidence: number;
  summary: string;
  reasoning: string;
  budgetImpact: string;
  savingsImpact: string;
  warningFlags?: string[];
}

export interface PriceAlternative {
  retailer: string;
  price: number;
  url: string;
  title: string;
  savings: number;
  thumbnail?: string;
}

export interface ProductAnalysis {
  id: string;
  timestamp: number;
  productInfo: ProductInfo;
  verdict: FinancialVerdict;
  priceAlternatives?: PriceAlternative[];
}
