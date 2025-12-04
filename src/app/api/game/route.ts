import { generateText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { getColorByCoordinate, ROWS, COLOR_MAP } from "@/lib/colorMap";
import { calculateScore } from "@/lib/scoring";
import { MODELS, ModelConfig } from "@/lib/models";
import type { ScoreResult } from "@/lib/scoring";

const gateway = createOpenAICompatible({
  name: "vercel-ai-gateway",
  baseURL: "https://ai-gateway.vercel.sh/v1",
  headers: {
    Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
  },
});

const DEFAULT_ROUNDS = 12;

function buildClueGiverPrompt(targetCoordinate: string, targetHex: string): string {
  return `You are playing Hues and Cues as the CLUE GIVER.

You have been assigned a secret target color at coordinate ${targetCoordinate} which is ${targetHex}.

The game board has 480 unique colors arranged in a 20x24 grid (rows A-T, columns 1-24).
The board transitions through: Reds → Oranges → Yellows → Greens → Teals → Blues → Purples → Magentas
Rows A-E are pastels, F-O are vivid, P-T are darker.

Give a ONE-WORD clue (no spaces, no hyphens, no color names) that will help others guess this color.

Respond with ONLY JSON: {"clue": "YourWord", "reasoning": "Why"}`;
}

function buildGuesserPrompt(clue: string): string {
  return `You are playing Hues and Cues. Guess the color coordinate for the clue: "${clue}"

Board: 20 rows (A-T) × 24 columns (1-24). Format: RowColumn (e.g., K12)
- Columns: Reds(1-2) → Oranges(3-4) → Yellows(5-6) → Greens(9-10) → Teals(11-12) → Blues(14-17) → Purples(18-20) → Pinks(21-24)
- Rows: A-E pastels, F-O vivid, P-T dark

Respond with ONLY JSON: {"guess": "K12", "reasoning": "Why"}`;
}

function parseClueResponse(response: string): { clue: string | null; reasoning: string | null } {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { clue: null, reasoning: null };
    const parsed = JSON.parse(jsonMatch[0]);
    let clue = parsed.clue?.trim()?.split(/\s+/)[0]?.replace(/[^a-zA-Z]/g, '') || null;
    return { clue, reasoning: parsed.reasoning || null };
  } catch {
    return { clue: null, reasoning: null };
  }
}

function parseGuessResponse(response: string): { guess: string | null; reasoning: string | null } {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { guess: null, reasoning: null };
    const parsed = JSON.parse(jsonMatch[0]);
    const guess = parsed.guess?.toUpperCase().replace(/\s/g, "") || null;
    if (guess) {
      const match = guess.match(/^([A-T])(\d+)$/i);
      if (match) {
        const row = match[1].toUpperCase();
        const col = parseInt(match[2], 10);
        if (ROWS.includes(row as typeof ROWS[number]) && col >= 1 && col <= 24) {
          return { guess: `${row}${col}`, reasoning: parsed.reasoning || null };
        }
      }
    }
    return { guess: null, reasoning: null };
  } catch {
    return { guess: null, reasoning: null };
  }
}

interface GuessResult {
  model: ModelConfig;
  guessCoordinate: string | null;
  guessHex: string | null;
  reasoning: string | null;
  score: number;
  zone: ScoreResult["zone"] | null;
  error: string | null;
  responseTime: number;
}

async function queryModel(modelId: string, prompt: string): Promise<{ text: string | null; error: string | null; responseTime: number }> {
  const startTime = Date.now();
  try {
    const { text } = await generateText({
      model: gateway.chatModel(modelId),
      prompt,
      maxOutputTokens: 200,
      temperature: 0.7,
    });
    return { text, error: null, responseTime: Date.now() - startTime };
  } catch (error) {
    return { text: null, error: error instanceof Error ? error.message : String(error), responseTime: Date.now() - startTime };
  }
}

function getRandomTarget(): { coordinate: string; hex: string } {
  const row = ROWS[Math.floor(Math.random() * ROWS.length)];
  const col = Math.floor(Math.random() * 24) + 1;
  const coordinate = `${row}${col}`;
  return { coordinate, hex: COLOR_MAP[coordinate] };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const totalRounds = Math.min(Math.max(parseInt(searchParams.get("rounds") || String(DEFAULT_ROUNDS)), 4), 24);

  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      // Initialize tournament
      const scores: Record<string, number> = {};
      MODELS.forEach(m => scores[m.id] = 0);

      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
        type: "tournament_init",
        totalRounds,
        models: MODELS,
        scores,
      })}\n\n`));

      // Play all rounds
      for (let round = 0; round < totalRounds; round++) {
        // Rotate clue giver
        const clueGiverIndex = round % MODELS.length;
        const clueGiver = MODELS[clueGiverIndex];
        const guessers = MODELS.filter((_, i) => i !== clueGiverIndex);
        const { coordinate: targetCoordinate, hex: targetHex } = getRandomTarget();

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: "round_start",
          round: round + 1,
          clueGiver,
          guessers,
          targetCoordinate,
          targetHex,
        })}\n\n`));

        // Clue giver generates clue
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: "clue_giver_thinking",
          round: round + 1,
        })}\n\n`));

        const clueResponse = await queryModel(clueGiver.id, buildClueGiverPrompt(targetCoordinate, targetHex));
        let clue: string;
        let clueReasoning: string | null = null;

        if (clueResponse.error || !clueResponse.text) {
          // Show error - no fallback
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: "clue_error",
            round: round + 1,
            error: clueResponse.error || "No response from model",
          })}\n\n`));
          // Skip to next round
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        } else {
          const parsed = parseClueResponse(clueResponse.text);
          clue = parsed.clue || "Mystery";
          clueReasoning = parsed.reasoning;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: "clue_generated",
            round: round + 1,
            clue,
            reasoning: clueReasoning,
          })}\n\n`));
        }

        // Each guesser places their guess (dots appear on board)
        const guesses: GuessResult[] = [];
        const guesserPrompt = buildGuesserPrompt(clue);

        for (let i = 0; i < guessers.length; i++) {
          const model = guessers[i];

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: "guesser_thinking",
            round: round + 1,
            modelId: model.id,
          })}\n\n`));

          const response = await queryModel(model.id, guesserPrompt);
          
          let guess: GuessResult;
          if (response.error || !response.text) {
            guess = {
              model,
              guessCoordinate: null,
              guessHex: null,
              reasoning: null,
              score: 0,
              zone: null,
              error: response.error,
              responseTime: response.responseTime,
            };
          } else {
            const parsed = parseGuessResponse(response.text);
            guess = {
              model,
              guessCoordinate: parsed.guess,
              guessHex: parsed.guess ? getColorByCoordinate(parsed.guess) : null,
              reasoning: parsed.reasoning,
              score: 0, // Will be calculated after reveal
              zone: null,
              error: parsed.guess ? null : "Failed to parse",
              responseTime: response.responseTime,
            };
          }
          
          guesses.push(guess);

          // Send guess placed event (dot appears on board)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: "guess_placed",
            round: round + 1,
            guess: {
              modelId: model.id,
              modelColor: model.color,
              coordinate: guess.guessCoordinate,
              hex: guess.guessHex,
              reasoning: guess.reasoning,
              error: guess.error,
              responseTime: guess.responseTime,
            },
          })}\n\n`));
        }

        // All guesses placed - now reveal the 3x3 scoring grid
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: "reveal_scoring",
          round: round + 1,
          targetCoordinate,
        })}\n\n`));

        // Wait so users can see the scoring grid clearly
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Calculate scores for each guess
        let clueGiverPoints = 0;
        const scoredGuesses = guesses.map(g => {
          if (g.guessCoordinate) {
            const scoreResult = calculateScore(g.guessCoordinate, targetCoordinate);
            if (scoreResult.score >= 2) clueGiverPoints++; // Clue giver gets 1 point per guesser in 3x3
            return { ...g, score: scoreResult.score, zone: scoreResult.zone };
          }
          return g;
        });

        // Update cumulative scores
        scoredGuesses.forEach(g => {
          scores[g.model.id] += g.score;
        });
        scores[clueGiver.id] += clueGiverPoints;

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: "round_complete",
          round: round + 1,
          clueGiver,
          clueGiverPoints,
          guesses: scoredGuesses,
          scores: { ...scores },
        })}\n\n`));

        // Delay between rounds so users can see the scores
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Tournament complete
      const rankings = MODELS.map(m => ({ model: m, score: scores[m.id] }))
        .sort((a, b) => b.score - a.score);

      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
        type: "tournament_complete",
        rankings,
        scores,
      })}\n\n`));

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
