# 🎨 Hues & Cues AI Battle

A live AI model evaluation game inspired by the board game [Hues and Cues](https://boardgamegeek.com/boardgame/320451/hues-and-cues). Watch 6 different AI models compete to guess colors from single-word clues!

Built for the [Vercel AI Gateway Hackathon](https://ai-gateway-game-hackathon.vercel.app/submit).

![Hues & Cues AI Battle](https://img.shields.io/badge/AI%20Gateway-Hackathon-blue)

## 🎮 How It Works

1. A random color clue is selected (e.g., "Banana", "Sky", "Ruby")
2. 6 AI models simultaneously receive the clue and must guess the coordinate on a 480-color board
3. Models are scored based on grid proximity to the target:
   - **3 points**: Exact match (center)
   - **2 points**: Within the 3×3 square around the target
   - **1 point**: On the boundary (5×5 minus 3×3)
   - **0 points**: Outside the scoring zone

## 🤖 Competing Models

- **GPT-4o** (OpenAI)
- **Claude Sonnet 4** (Anthropic)
- **Gemini 2.5 Pro** (Google)
- **Grok 3** (xAI)

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **AI Integration**: [Vercel AI SDK](https://ai-sdk.dev) + [AI Gateway](https://vercel.com/ai-gateway)
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- [Vercel AI Gateway API Key](https://vercel.com/ai-gateway)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/hues-clues-ai-battle.git
cd hues-clues-ai-battle

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your AI Gateway API key

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the game.

### Environment Variables

```
AI_GATEWAY_API_KEY=your_api_key_here
```

Get your API key from [Vercel AI Gateway](https://vercel.com/ai-gateway).

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx          # Main page (Server Component)
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/
│   ├── GameDisplay.tsx   # Main game UI (Client Component)
│   ├── ColorBoard.tsx    # 480-color board visualization
│   └── ModelCard.tsx     # Individual model result cards
└── lib/
    ├── colorMap.ts       # 480-color grid data + clue dictionary
    ├── scoring.ts        # Grid-based scoring system
    ├── gameLogic.ts      # Server action for running the game
    ├── models.ts         # AI model configurations
    └── types.ts          # TypeScript interfaces
```

## 🎯 Scoring System

The scoring follows the official Hues and Cues rules:

- A **3×3 scoring frame** is centered on the target color
- **Exact match** (center): 3 points
- **Inner ring** (8 surrounding cells): 2 points  
- **Outer ring** (boundary, 16 cells): 1 point
- **Miss** (outside): 0 points

## 🎨 Color Board

The board consists of 480 colors arranged in a 20×24 grid:

- **Rows A-T**: Control brightness/saturation
  - A-E: Lighter, pastel colors
  - F-O: Vivid, saturated colors
  - P-T: Darker, deeper colors
- **Columns 1-24**: Control hue
  - Transitions through: Reds → Oranges → Yellows → Greens → Teals → Blues → Purples → Magentas

## 📜 License

MIT

## 🙏 Acknowledgments

- [Hues and Cues](https://boardgamegeek.com/boardgame/320451/hues-and-cues) by USAopoly
- [Vercel AI SDK](https://ai-sdk.dev)
- [Vercel AI Gateway](https://vercel.com/ai-gateway)
