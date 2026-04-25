# **🏆 Sentinel Node: Phase 2 Product Requirements Document (PRD)**

## **1\. Project Overview**

**Sentinel Node** is a Smart Emergency & Disaster Evacuation System. It transforms standard CCTVs into an intelligent, decentralized mesh network. When a crisis (fire, weapon, injury) occurs, the system detects the threat, logs it immutably, calculates the safest evacuation route using an LLM, and broadcasts hyper-realistic audio directions to affected zones.

For the Hackathon Demo, we are executing a **Two-Node Physical Mesh Simulation** to prove end-to-end (E2E) latency and hardware integration.

## **2\. The Two-Node Architecture & Workflow**

### **🟢 Node 1: The "Detection" Node (Laptop)**

* **Hardware:** Laptop Web Camera.  
* **Role:** Simulates a compromised sector.  
* **Action:** Captures live footage. If a disaster (e.g., printed picture of a gun or fire) is held up to the camera, the local script POSTs the frame to the Vultr Cloud Server.

### **🧠 The Brain: Centralized Cloud Orchestration (Vultr Server)**

The Vultr backend orchestrates the Crisis Loop. All external APIs (Vision, Gemma, ElevenLabs) have their own isolated Next.js API routes to prevent serverless timeouts and enforce modularity:

* **Vision:** Passes the Node 1 frame to Google Cloud Vision API. Evaluates confidence thresholds for threat labels.  
* **Log:** If threat \> 80% confidence, INSERT into Snowflake THREAT\_ALERTS table.  
* **Triage:** Pings Gemma 4 with prompt: "Calculate evacuation route. Threat is at Node 1."  
* **Voice:** Passes Gemma's routing instructions to ElevenLabs API to generate an MP3 buffer.  
* **Dispatch:** Pushes the actionable payload (Threat Status \+ Audio Buffer) down to Node 2 via the Ethernet network.

### **🔴 Node 2: The "Action/Hardware" Node (Raspberry Pi 4\)**

* **Hardware:** Raspberry Pi 4B, Ethernet connection, Breadboard, LEDs, Buzzer, Speaker (3.5mm/Bluetooth), HC-SR04 Ultrasonic Sensor.  
* **Role:** Simulates an adjacent safe sector guiding civilians.  
* **Action:** \* Receives the threat payload from the Vultr server.  
  * Flashes Red/Green LEDs (visual guidance).  
  * Sounds the Piezo buzzer (attention alarm).  
  * Plays the ElevenLabs evacuation MP3 over the connected speaker.  
* **Fallback Routine (Lights Out):** If the environment goes dark, the HC-SR04 ultrasonic sensor acts as a motion detector. If a civilian walks past (distance suddenly drops), the Pi flashes LEDs to guide them and pings the server: "Movement at Node 2."

## **3\. Hardware Bill of Materials (Complete Inventory)**

**Core Compute:**

* Raspberry Pi 4 Model B (4GB)  
* Raspberry Pi Power Cable  
* 8GB Micro SD Card (flashed with Raspberry Pi OS)  
* MicroSD to USB Adapter (for laptop flashing)

**Networking & Inputs:**

* Ethernet Cable (Direct connection between laptop and Pi for zero-latency network sharing)  
* Laptop Webcam (Acting as Node 1's eyes)  
* HC-SR04 Ultrasonic Sensor

**Circuitry & Wiring:**

* Small Breadboard  
* Male-to-Female (M/F) jumper cables  
* Male-to-Male (M/M) jumper wires  
* 2x 330Ω (or 220Ω) Resistors (for LEDs)  
* 1x 1kΩ Resistor & 1x 2kΩ Resistor (for the Ultrasonic Sensor voltage divider)

**Outputs / Indicators:**

* 1x Red LED  
* 1x Green LED  
* 1x Piezo Buzzer  
* 1x Wired Speaker or Headphones (or Bluetooth paired for ElevenLabs playback)

## **4\. Frontend UI/UX Specifications**

The frontend is a dark-mode, tactical Next.js dashboard used by First Responders. It uses Tailwind CSS and shadcn/ui.

### **4.1 Global Layout (/app/dashboard/layout.tsx)**

* **Sidebar (Left):** Logo: "SENTINEL COMMAND". Navigation links: Dashboard, Node Grid, Database Logs. User Profile at bottom (Auth0 user info).  
* **Main Content Area:** Dark background (bg-slate-950), responsive grid layout.

### **4.2 State Management (/store/useCrisisStore.ts)**

Global state is managed via Zustand. Required schema:

* status: "IDLE" | "ANALYZING" | "CRISIS\_ACTIVE"  
* threatData: null | { type: string, location: string, confidence: number }  
* actionLog: Array\<{ timestamp: string, message: string }\>  
* activeNode: "NODE-001 (Main Hall)"  
* **Actions:** setStatus(), setThreat(), addToLog(), resetCrisis()

### **4.3 The Main Dashboard (/app/dashboard/page.tsx)**

* **Panel 1: The Edge Node Feed (Top Left)**  
  * Mocks the Raspberry Pi camera feed.  
  * \<Webcam /\> component inside a rounded div with a glowing border (Green if IDLE, pulsing Red if CRISIS\_ACTIVE).  
  * Controls: "Start Auto-Scan" (interval trigger) & "Manual Override Scan" (instant trigger).  
* **Panel 2: Tactical Mesh Map (Right Side)**  
  * Grid showing 4 Nodes. Node 1 is Main Hall.  
  * When status \=== CRISIS\_ACTIVE, Node 1 turns bright red, and animated arrows point from Node 1 to a safe node.  
* **Panel 3: Live Incident Log (Bottom Full Width)**  
  * Shadcn Table component showing the real-time flow of orchestrated API calls based on actionLog Zustand store.

## **5\. Software Architecture: The "Crisis Loop" Orchestration**

To avoid backend API chaining and serverless timeouts, the React Client (useCrisisLoop.ts hook) manages the orchestration and data flow. Every fetch call must be wrapped in try/catch.

1. **Trigger:** User clicks "Analyze Frame".  
2. **Vision Check:** Send base64 frame to /api/vision.  
3. **Evaluation:** Parse response. If threat\_detected \=== true, proceed.  
4. **Initial Log:** Send threat data to /api/snowflake/log.  
5. **AI Routing:** Send threat data to /api/gemma.  
6. **Audio Gen:** Send Gemma's response text to /api/audio.  
7. **Action Log:** Log the final AI decision to /api/snowflake/log.  
8. **Broadcast:** Play audio buffer via native browser Audio API.

**🛑 Error Handling & Fallbacks (Critical):**

* **Vision Failure:** Abort loop. Show Shadcn Toast: "Vision API Timeout."  
* **Gemma Failure:** DO NOT crash. Use hardcoded fallback: "Emergency detected. Please evacuate the area immediately."  
* **Audio Failure:** Trigger browser's native window.speechSynthesis.speak() as a fallback voice.

## **6\. BearHacks 2026: Free API Credits Strategy**

* **Google Cloud Vision API:** First 1,000 requests free.  
* **Google Gemma 4 (AI Studio):** Free tier (15 RPM / 1M Tokens/day).  
* **Snowflake:** MLH Track 120-day student trial (No CC required).  
* **ElevenLabs:** Free tier (10k chars/month). Use MLH promo code for Creator tier.  
* **Vultr:** Use MLH hackathon credits ($50-$250). Destroy instance on Sunday.  
* **Auth0:** Permanently free for \<7,500 users.

*Golden Rule:* Never commit .env files to GitHub. Add to .gitignore immediately.

## **7\. Backend API Routes & Schemas**

**7.1 Google Cloud Vision (/api/vision)**

* Method: POST  
* Payload In: { "image\_base64": "data:image/jpeg;base64,..." }  
* Payload Out:  
  {  
    "success": true,  
    "threat\_detected": true,  
    "threat\_type": "Fire",  
    "confidence": 0.98,  
    "raw\_labels": \["Fire", "Heat", "Building"\]  
  }

**7.2 Gemma 4 AI (/api/gemma)**

* Method: POST  
* Payload In: { "threat\_type": "Fire", "location": "Main Hall" }  
* Payload Out:  
  {  
    "success": true,  
    "evacuation\_message": "Fire detected in Main Hall. Proceed calmly to the North Exit stairwell immediately."  
  }

**7.3 ElevenLabs Audio (/api/audio)**

* Method: POST  
* Payload In: { "text": "Fire detected in Main Hall..." }  
* Payload Out: Raw audio buffer or base64 encoded audio string.

**7.4 Snowflake DB (/api/snowflake/log & /api/snowflake/history)**

* Log Payload In: { "node\_id": "NODE-001", "event\_type": "THREAT\_DETECTED", "details": "Fire 98%" }  
* Log Payload Out: { "success": true }  
* History Payload Out: { "success": true, "data": \[...\] }

## **8\. Priority & Scope Reduction Matrix**

| Priority | Feature | Status / Fallback Plan |
| :---- | :---- | :---- |
| **P0 (Must Have)** | UI Dashboard & Mock APIs | **Active.** Frontend is 95% complete. Use setTimeout and hardcoded JSON to ensure UI works even if Vultr crashes. |
| **P0 (Must Have)** | E2E Node 1 to Node 2 Flow | **Active.** Laptop Cam \-\> Server \-\> Pi LEDs & Audio. (The core "wow" factor). |
| **P1 (High Value)** | Live Snowflake Logging | **Active.** Write to DB and fetch for UI Incident Log. |
| **P2 (Fakable)** | Network/SSH Issues | **Fallback:** Run Node 2 Python script locally on laptop and pretend laptop is the Pi. |
| **P3 (Drop)** | Inter-Node WebSockets | **Dropped.** Server handles all routing. Nodes do not talk to each other directly. |

## **9\. End-to-End Demo Workflow (The Presentation)**

**Phase 1: System Nominal (The Baseline)**

* Dashboard open, showing DEFCON 5\. Node 1 feed is live. Node 2 (Pi) is connected, Green LED illuminated.

**Phase 2: The Incident (Triggering the Loop)**

* Hold up a printed picture of a weapon or fire to laptop webcam.

**Phase 3: The Dashboard Reaction (Software E2E)**

* Status shifts to CRISIS\_ACTIVE (Red/Tactical UI).  
* Map updates with animated routing arrows.  
* Incident Log auto-populates NODE 1 \- FIRE\_DETECTED \- CRITICAL.

**Phase 4: The Hardware Reaction (Physical E2E)**

* Server pings Gemma, sends to ElevenLabs, pushes payload down Ethernet to Pi.  
* Green LED shuts off. Red LED flashes violently. Buzzer sounds alarm.  
* Speaker plays ElevenLabs audio: *"Attention. Threat detected in Sector 1\. Proceed immediately to the North Exit."*

**Phase 5: The "Lights Out" Bonus (Optional Flex)**

* Cover laptop webcam. Run hand in front of Pi's HC-SR04 Ultrasonic Sensor.  
* Pi detects proximity change, flashes LEDs in runway pattern, logs movement back to server.