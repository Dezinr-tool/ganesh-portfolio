import { NextRequest, NextResponse } from "next/server";

const VOICE_ID = "T8lgQl6x5PSdhmmWx42m";

function cleanForSpeech(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateToFirstTwoSentences(text: string): string {
  const cleaned = text.trim();
  if (!cleaned) return cleaned;

  const sentences =
    cleaned.match(/[^.!?।]+[.!?।]+(?:\s|$)|[^.!?।]+$/g)?.map((s) => s.trim()) ??
    [];

  if (sentences.length === 0) return cleaned;

  return sentences.slice(0, 2).join(" ").trim();
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    if (!text?.trim()) {
      return NextResponse.json({ error: "Text is required." }, { status: 400 });
    }
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ElevenLabs not configured." }, { status: 500 });
    }
    const speechText = truncateToFirstTwoSentences(cleanForSpeech(text));
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: speechText,
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.50,
            similarity_boost: 0.80,
            style: 0.40,
            use_speaker_boost: true,
            speed: 0.85,
          },
        }),
      }
    );
    if (!response.ok) {
      const errorBody = await response.text();
      console.error("ElevenLabs error:", response.status, errorBody);
      return NextResponse.json({ error: "Failed to generate speech." }, { status: 502 });
    }
    const audioBuffer = await response.arrayBuffer();
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("ea speak error:", error);
    return NextResponse.json({ error: "Failed to generate speech." }, { status: 500 });
  }
}