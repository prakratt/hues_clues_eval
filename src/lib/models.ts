// Model definitions - 4 models for the tournament
export interface ModelConfig {
  id: string;
  name: string;
  shortName: string;
  color: string;
  bgColor: string;
}

// 4 working models for the game
export const MODELS: ModelConfig[] = [
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    shortName: "GPT-4o",
    color: "#10a37f",
    bgColor: "bg-emerald-500",
  },
  {
    id: "anthropic/claude-sonnet-4",
    name: "Claude Sonnet 4",
    shortName: "Claude",
    color: "#d97706",
    bgColor: "bg-amber-500",
  },
  {
    id: "google/gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    shortName: "Gemini",
    color: "#4285f4",
    bgColor: "bg-blue-500",
  },
  {
    id: "xai/grok-2",
    name: "Grok 2",
    shortName: "Grok",
    color: "#171717",
    bgColor: "bg-neutral-800",
  },
];
