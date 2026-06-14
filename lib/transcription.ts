export type TranscriptionResult = {
  text: string;
  language: string;
  duration: number;
  segments: Array<{
    start: number;
    end: number;
    text: string;
  }>;
  error?: boolean;
};

const MOCK_TRANSCRIPT =
  "[00:00] Mock transcript — set OPENAI_API_KEY for real Whisper transcription.";

export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string = "audio/webm",
): Promise<TranscriptionResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      text: MOCK_TRANSCRIPT,
      language: "en",
      duration: 0,
      segments: [{ start: 0, end: 0, text: MOCK_TRANSCRIPT }],
      error: true,
    };
  }

  try {
    const formData = new FormData();
    const file = new File([new Uint8Array(audioBuffer)], "audio.webm", {
      type: mimeType,
    });
    formData.append("file", file);
    formData.append("model", "whisper-1");
    formData.append("response_format", "verbose_json");

    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: formData,
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[transcription] Whisper error:", response.status, errorBody);
      return {
        text: "",
        language: "en",
        duration: 0,
        segments: [],
        error: true,
      };
    }

    const data = (await response.json()) as {
      text?: string;
      language?: string;
      duration?: number;
      segments?: Array<{ start: number; end: number; text: string }>;
    };

    return {
      text: data.text ?? "",
      language: data.language ?? "en",
      duration: data.duration ?? 0,
      segments: data.segments ?? [],
    };
  } catch (error) {
    console.error("[transcription] failed:", error);
    return {
      text: "",
      language: "en",
      duration: 0,
      segments: [],
      error: true,
    };
  }
}

export function formatTranscriptForAI(result: TranscriptionResult): string {
  if (result.segments.length === 0) {
    return result.text.trim();
  }

  return result.segments
    .map((segment) => {
      const mins = Math.floor(segment.start / 60)
        .toString()
        .padStart(2, "0");
      const secs = Math.floor(segment.start % 60)
        .toString()
        .padStart(2, "0");
      return `[${mins}:${secs}] ${segment.text.trim()}`;
    })
    .join("\n");
}
