export interface AgroInput {
  id: string;
  title: string;
  description: string;
  price: number;
  unit: string; // e.g., "per kg", "per bag", "500ml bottle"
  category: "Seeds" | "Fertilizers" | "Pesticides" | "Tools" | "Other";
  imageUrl: string;
  stock: number;
  contactPhone: string;
  createdAt: number;
}

export interface Training {
  id: string;
  title: string;
  description: string;
  date: string; // e.g., "July 15, 2026"
  location: string; // e.g., "Online", "Gulu Demonstration Farm"
  skillsCovered: string[];
  instructorBio: string;
  duration: string; // e.g., "2 hours", "3 days"
  imageUrl: string;
  createdAt: number;
}

export interface Question {
  id: string;
  questionText: string;
  askerName: string;
  askerEmail?: string;
  answerText?: string;
  answeredBy?: string;
  dateAsked: number;
  dateAnswered?: number;
  isAnswered: boolean;
  category: "Crops" | "Animals" | "General";
  upvotes: number;
}

export interface Subscription {
  id: string;
  email: string;
  subscribedAt: number;
  isActive: boolean;
}

export interface Consultation {
  id: string;
  name: string;
  email: string;
  category: "Crops" | "Animals" | "Farm Management" | "Other";
  query: string;
  status: "Pending" | "In-Progress" | "Resolved";
  responseText?: string;
  createdAt: number;
  repliedAt?: number;
}
