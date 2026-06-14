export const DEFAULT_EA_NAME = "Virtual EA";

export type EASettings = {
  eaName: string;
};

export const DEFAULT_EA_SETTINGS: EASettings = {
  eaName: DEFAULT_EA_NAME,
};

export function buildEAGreeting(eaName: string): string {
  return `Hi Ganesh — I'm ${eaName}, your Executive Assistant. Tap the mic to speak.`;
}

export function buildEAPreview(eaName: string): string {
  return `Hi Ganesh, I'm ${eaName}, your Executive Assistant`;
}

export function normalizeEASettings(
  input: Partial<EASettings> | null | undefined,
): EASettings {
  const eaName = input?.eaName?.trim();
  return {
    eaName: eaName && eaName.length > 0 ? eaName : DEFAULT_EA_NAME,
  };
}
