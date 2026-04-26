# **🏆 Sentinel Node: Phase 2 Product Requirements Document (PRD)**

*Updated: Live Production State*

## **1\. Project Overview**

**Sentinel Node** is a Smart Emergency & Disaster Evacuation System. It transforms standard cameras into an intelligent, decentralized mesh network. When a crisis (e.g., active shooter) occurs, the system detects the threat, logs it immutably, calculates the safest evacuation route using an LLM, and broadcasts hyper-realistic audio directions to affected zones.

**🚨 HACKATHON PIVOT (WHERE WE ARE RIGHT NOW):**

Due to severe hardware/networking blockers (Windows ICS DHCP hijacking via VMware, WPA3 Headless isolation, and missing micro-HDMI cables), **we have entirely scrapped the Raspberry Pi physical hardware.** Instead, we successfully executed a **Hardware-Agnostic Edge Node Pivot**. We are using twin laptops running a decoupled Python script (node.py) to simulate physical IoT nodes. Furthermore, Vultr hosting was abandoned due to a 48-hour verification delay, and we are now successfully deployed live on **Railway**.

## **2\. The Two-Node Architecture & Workflow (Updated)**

### **🟢 The Edge Nodes: Laptop 1 & Laptop 2 (Python)**

* **Hardware:** Twin Laptops (acting as NODE-001 and NODE-002).  
* **Software:** A standalone Python script (node.py) running OpenCV (cv2), requests, and pygame.  
* **Role:** Completely decoupled from the browser to avoid Windows 11 Virtual Camera hijacking.  
* **Action:** \* *Vision Thread:* Captures a frame every 3 seconds, encodes to base64, and POSTs to the Railway Server.  
  * *Audio Thread:* Polls the Railway server every 2 seconds. If it receives a threat alert and an audio buffer targeted at its specific Node ID, it plays the evacuation alarm locally.

### **🧠 The Brain: Centralized Cloud Orchestration (Railway \+ Snowflake)**

The Next.js backend (live at sentinal-node-production.up.railway.app) orchestrates the Crisis Loop.

* **Vision (PIVOTED):** Google Cloud Vision LABEL\_DETECTION failed to identify a tactical shooter. We pivoted to **Gemini 1.5 Flash**, which accurately processes the tactical context.  
* **State / Log:** Uses **Snowflake** (CRISIS\_EVENTS table) as the central brain. If Gemini detects a threat, it INSERTs it here.  
* **Triage:** Pings Gemma with the prompt: "Calculate evacuation route. Threat is at Node X."  
* **Voice:** Passes Gemma's routing instructions to ElevenLabs API to generate an MP3 buffer.  
* **Dispatch:** Saves the ElevenLabs audio buffer to the Snowflake row, waiting for the target Node's Python script to poll and fetch it.

## **3\. Hardware Bill of Materials (The Scrapped & The New)**

\~\~**Scrapped Compute & Wiring:**\~\~

* \~\~Raspberry Pi 4 Model B (4GB), Breadboard, LEDs, HC-SR04 Ultrasonic Sensor, Ethernet direct-connect.\~\~ *(Reason: Windows DHCP/VMware blockage & hackathon time constraints).*

**Current Active Hardware:**

* **Laptop 1 (Node 1):** Runs node.py, uses integrated webcam, POSTs frames.  
* **Laptop 2 (Node 2):** Runs node.py, polls DB, uses built-in speakers for ElevenLabs audio.  
* **Display Client:** Any browser opening the Railway URL to view the Command Dashboard.

## **4\. Frontend UI/UX Specifications**

### **4.1 The Main Dashboard (/app/dashboard/page.tsx)**

* **Panel 1: The Edge Node Feeds (Top Left)**  
  * \~\~\<Webcam /\> component.\~\~ *(Scrapped due to Windows Virtual Camera hijacking).*  
  * **NEW:** Standard HTML \<img\> tags. The React frontend uses a useEffect to poll /api/node/frame every 2 seconds to fetch the base64 frames held in the Next.js server memory, rendering the live feeds without touching the browser's local camera.  
* **Panel 2: Tactical Mesh Map (Right Side)**  
  * Grid showing the Nodes. When CRISIS\_ACTIVE, the compromised node turns bright red, and LLM Rescue Notes are displayed.

## **5\. Software Architecture: The "Crisis Loop" Orchestration**

The flow is now driven by backend server-state, not the React client.

1. **Capture:** Python script (node.py) POSTs frame to Railway /api/node/frame.  
2. **Vision Check:** Next.js passes frame to Gemini 1.5 Flash.  
3. **State Update:** If threat detected, Next.js POSTs to Snowflake (/api/events/push).  
4. **AI Routing:** Next.js pings Gemma for escape routes.  
5. **Audio Gen:** Next.js pings ElevenLabs, gets audio buffer, saves to Snowflake.  
6. **Execution:** Node 2's Python script polls /api/events/sync, sees the audio buffer, downloads it, and plays it via pygame.

## **6\. API Credits & Deployment Strategy (Updated)**

* **Vision:** Gemini 1.5 Flash (via AI Studio Free Tier).  
* **Routing:** Google Gemma (AI Studio Free Tier).  
* **Database:** Snowflake (120-day student trial).  
* **Voice:** ElevenLabs (Free Tier).  
* **Hosting:** **Railway** (Custom node:20-alpine Dockerfile bypassing pnpm lockfile crashes).

## **7\. Backend API Routes & Schemas**

* **NEW:** POST /api/node/frame \-\> Accepts { node\_id, image\_base64 }. Stores in memory global.nodeFrames and triggers Gemini.  
* **NEW:** GET /api/node/frame \-\> Frontend polls this to display live feeds.  
* POST /api/events/push \-\> Writes threat to Snowflake.  
* GET /api/events/sync \-\> Python nodes poll this to receive audio instructions.

## **8\. Priority & Scope Matrix (CURRENT FOCUS)**

| Priority | Feature | Status / Action Plan |
| :---- | :---- | :---- |
| **P0** | Railway Deployment | **✅ DONE.** App is live on production URL. |
| **P0** | Python Edge Nodes | **✅ DONE.** node.py successfully decoupled camera/audio. |
| **P1** | Interactive Demo APIs | **🛠️ IN PROGRESS.** Converting old sandbox pages into isolated tools to prove Vision, Audio, and DB work independently for the judges. |
| **P1** | Solana Audit Log | **PENDING (Focus).** Add @solana/web3.js to log threat hashes immutably to the devnet. |
| **P2** | Auth0 Integration | **PENDING (Focus).** Lock down the Next.js /dashboard route. |
| **P3** | Two-Way Audio | **PENDING (Flex).** Add Web Speech API / Python SpeechRecognition so civilians can talk back to the cameras. |

## **9\. End-to-End Demo Workflow (How we pitch to Judges)**

**Phase 1: The Setup**

* Open the Railway Dashboard on a monitor. Explain that the laptops running terminal scripts represent physical IoT cameras (Raspberry Pis).

**Phase 2: The Independent API Demo (Sandbox)**

* Use the Sandbox pages to show the judges the raw Google Vision JSON, the raw Gemma output, and the Snowflake data injection to prove it's not "smoke and mirrors."

**Phase 3: The Incident**

* Hold the picture of the tactical shooter up to Laptop 1's webcam.

**Phase 4: The Mesh Reaction**

* Laptop 1's terminal says Threat Detected. POSTing to Server.  
* The Railway Dashboard turns Red, highlighting Node 1, displaying Gemma's dynamic escape route.  
* Laptop 2's terminal says Emergency Instruction Received. and blasts the ElevenLabs audio alarm: *"Attention. Armed threat detected in Sector 1\. Proceed immediately to the North Exit."*

