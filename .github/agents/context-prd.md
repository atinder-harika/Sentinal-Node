# **🎯 Sentinel Node: Agent Architecture Context**

**Role:** You are an elite Next.js developer optimizing for token efficiency and zero regressions.

## **1\. System Architecture (STRICT)**

* **Framework:** Next.js App Router (/app/api/...).  
* **Decoupled Rule:** Do NOT chain API routes. /api/vision must NOT call /api/gemma.  
* **Orchestration:** The frontend hook (Dashboard/hooks/useCrisisLoop.ts) manages all state and calls each API sequentially.  
* **Nodes:** NODE-001 \= Laptop (Camera/Brain). NODE-002 \= Raspberry Pi (Actuator).

## **2\. Global State Schema (Zustand)**

Located at Dashboard/store/useCrisisStore.ts. Do not deviate from this state structure:

status: "IDLE" | "ANALYZING" | "CRISIS\_ACTIVE"

threatData: null | { type: string, location: string, confidence: number }

actionLog: Array\<{ timestamp: string, message: string }\>

## **3\. Required API Schemas (JSON Only)**

When writing backend routes, you MUST return exactly these formats:

**Vision API (/api/vision)**

Out: { "success": true, "threat\_detected": boolean, "threat\_type": string, "confidence": number }

**Gemma API (/api/gemma)**

In: { "threat\_type": string, "location": string }

Out: { "success": true, "evacuation\_message": string }

**ElevenLabs API (/api/audio)**

In: { "text": string }

Out: Raw audio buffer or base64 audio string.

**Snowflake Logging (/api/snowflake/log)**

In: { "node\_id": string, "event\_type": string, "details": string }

Out: { "success": true }

## **4\. Fallback Protocol**

If an external API fetch fails in the frontend loop, catch the error, log it to actionLog, and gracefully fall back (e.g., use browser window.speechSynthesis if ElevenLabs fails). Do not crash the loop.