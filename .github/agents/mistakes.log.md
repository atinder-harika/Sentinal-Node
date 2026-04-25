# **🛑 AI Agent Guardrails & Mistakes Log**

*Do not repeat these architectural mistakes.*

## **❌ 1\. API Route Chaining**

**Mistake:** Making /api/vision internally call /api/gemma.

**Rule:** NEVER chain APIs on the backend. The React Client (useCrisisLoop.ts) acts as the sole orchestrator.

## **❌ 2\. Hardcoding API Keys**

**Mistake:** Writing const key \= "AIza..." in the file.

**Rule:** ALWAYS use process.env. Frontend keys require NEXT\_PUBLIC\_. Backend keys do not.

## **❌ 3\. Crashing on Timeout**

**Mistake:** Letting an ElevenLabs quota error crash the React app.

**Rule:** Wrap EVERY fetch in useCrisisLoop with try/catch. Provide native browser fallbacks (e.g., window.speechSynthesis).

## **❌ 4\. Wasting Token Quota**

**Mistake:** Outputting a full 500-line file to change one variable.

**Rule:** Only output the specific function or code block that needs modification. Use // ... existing code ... to preserve the user's Copilot quota.