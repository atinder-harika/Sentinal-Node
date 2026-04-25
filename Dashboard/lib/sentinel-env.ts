/**
 * Sentinel Node — Environment helpers.
 * Centralizes which 3rd-party services are wired up so each /api route can
 * gracefully fall back to a typed mock during development.
 */

export const env = {
  // Google Cloud Vision
  GCP_VISION_KEY: process.env.GCP_VISION_API_KEY ?? "",
  GCP_PROJECT_ID: process.env.GCP_PROJECT_ID ?? "",
  GCP_SERVICE_ACCOUNT_JSON: process.env.GCP_SERVICE_ACCOUNT_JSON ?? "",

  // Google Generative AI (Gemma / Gemini)
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? "",
  GEMINI_MODEL: process.env.GEMINI_MODEL ?? "gemini-1.5-flash",

  // ElevenLabs
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY ?? "",
  ELEVENLABS_VOICE_ID:
    process.env.ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM", // Rachel default
  ELEVENLABS_MODEL_ID:
    process.env.ELEVENLABS_MODEL_ID ?? "eleven_turbo_v2_5",

  // Snowflake
  SNOWFLAKE_ACCOUNT: process.env.SNOWFLAKE_ACCOUNT ?? "",
  SNOWFLAKE_USERNAME: process.env.SNOWFLAKE_USERNAME ?? "",
  SNOWFLAKE_PASSWORD: process.env.SNOWFLAKE_PASSWORD ?? "",
  SNOWFLAKE_DATABASE: process.env.SNOWFLAKE_DATABASE ?? "SENTINEL",
  SNOWFLAKE_SCHEMA: process.env.SNOWFLAKE_SCHEMA ?? "PUBLIC",
  SNOWFLAKE_WAREHOUSE: process.env.SNOWFLAKE_WAREHOUSE ?? "COMPUTE_WH",
  SNOWFLAKE_ROLE: process.env.SNOWFLAKE_ROLE ?? "",

  // Pi / Node 2 dispatch
  NODE2_PUSH_URL: process.env.NODE2_PUSH_URL ?? "",
} as const;

export const wired = {
  vision: Boolean(env.GCP_VISION_KEY || env.GCP_SERVICE_ACCOUNT_JSON),
  gemma: Boolean(env.GEMINI_API_KEY),
  audio: Boolean(env.ELEVENLABS_API_KEY),
  snowflake: Boolean(env.SNOWFLAKE_ACCOUNT && env.SNOWFLAKE_USERNAME),
  node2: Boolean(env.NODE2_PUSH_URL),
};

/**
 * Threat keywords used to convert raw vision labels into a typed threat.
 * Order matters — earlier entries take priority.
 */
export const THREAT_KEYWORDS: Array<{ match: RegExp; type: string }> = [
  { match: /\b(fire|flame|smoke|wildfire|inferno)\b/i, type: "Fire" },
  { match: /\b(gun|pistol|rifle|firearm|weapon|knife|blade)\b/i, type: "Weapon" },
  { match: /\b(blood|wound|injury|bleeding)\b/i, type: "Injury" },
  { match: /\b(flood|water damage)\b/i, type: "Flood" },
  { match: /\b(explosion|blast|debris)\b/i, type: "Explosion" },
];

export const THREAT_CONFIDENCE_THRESHOLD = 0.8;
