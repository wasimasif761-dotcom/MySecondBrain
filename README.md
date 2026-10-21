# MySecondBrain 🧠⚡

> **Offline-First Personal AI Assistant** with Local WebGPU Reasoning, Vector RAG Memory, Agentic Web Search, Multilingual Voice, and PDF Ingestion.  
> **Author:** Waseem Asif  
> **Contact / Feedback:** [wasimasif761@gmail.com](mailto:wasimasif761@gmail.com)  
> **License:** MIT

---

## 🌟 Overview

**MySecondBrain** is a next-generation, private-by-design Personal AI Assistant that runs **100% locally in your browser**. By leveraging **WebLLM** and **WebGPU**, it performs full neural reasoning on client-side hardware without sending private conversations, documents, or voice audio to any external cloud API or proprietary LLM server.

Equipped with **IndexedDB vector database** powered by **Transformers.js**, autonomous **Wikipedia web research**, dynamic **multilingual RTL support** (Urdu, Roman Urdu, Arabic, Hindi, English), **Voice-to-Voice** capabilities, and **PDF document ingestion**, MySecondBrain transforms your browser into a persistent second brain that remembers your life, learns continuously, and operates flawlessly offline.

---

## 🚀 Key Features

### 1. ⚡ Offline-First Local AI Engine (WebLLM & WebGPU)
- Runs `Llama-3-8B-Instruct-q4f32_1-MLC` (or lightweight models like `SmolLM2-1.7B` and `Qwen2.5-1.5B`) natively inside your browser.
- Real-time WebGPU hardware detection (adapter, vendor, VRAM, and memory limits).
- Holographic onboarding HUD with progress bar, byte counter, and instant offline engine fallback.

### 2. 🧠 Long-Term Memory Vault & Vector RAG (IndexedDB)
- Automatically embeds user queries, conversational insights, and uploaded documents using `Transformers.js` (`Xenova/all-MiniLM-L6-v2`).
- Stores memory vectors persistently in `IndexedDB` (`MySecondBrainDB`).
- Computes **cosine similarity** to automatically retrieve and inject the top 3 relevant memories into the AI prompt as contextual background.
- Interactive memory pills on responses let you inspect exactly which past memories influenced each answer.

### 3. 🌐 Agentic Web Search (Self-Updating Knowledge)
- Autonomous agent: When the AI encounters missing data or recent events, it triggers:
  ```json
  {"action": "search", "query": "your query"}
  ```
- The client-side engine intercepts this call, queries the live Wikipedia Search and Extract APIs, synthesizes the findings, and answers the user.
- **Permanent Knowledge Ingestion:** Newly discovered facts are vectorized and stored in IndexedDB so they are available offline forever.

### 4. 🌍 Multilingual & RTL Intelligence
- Seamlessly toggle between:
  - **Urdu (اردو)** — Full Right-to-Left (RTL) formatting and Nastaliq typography
  - **Roman Urdu** — Natural conversational Urdu in Latin script
  - **Arabic (العربية)** — Elegant RTL Modern Standard Arabic
  - **Hindi (हिंदी)** — Devanagari script support
  - **English** — Standard US/UK English
- The AI responds natively in the selected language and dynamically adjusts the UI reading direction.

### 5. 🎙️ Voice-to-Voice (Web Speech API)
- **Speech-to-Text (STT):** Microphone input with real-time audio detection tailored to your selected language.
- **Text-to-Speech (TTS):** Natural speech synthesis with pitch and speed controls, mute/unmute toggle, and replay buttons on individual responses.

### 6. 📄 PDF Document Ingestion (`pdf.js`)
- Upload any PDF document to extract text page-by-page.
- Chunks text into semantic passages with overlap, computes vector embeddings, and stores them in your Memory Vault for document question answering.

### 7. 🎭 AI Personas
- **Strict Teacher (سخت استاد):** Rigorous, logically exacting professor correcting mistakes and explaining first principles.
- **Empathetic Friend (نرم دوست):** Warm, deeply compassionate companion listening without judgment.
- **Professional Advisor (پروفیشنل ایڈوائزر):** Strategic, concise executive consultant delivering actionable frameworks.

### 8. 💾 Data Sovereignty & Portability
- **Export Brain:** One-click JSON backup of all memories, vectors, and chat history.
- **Import Brain:** Instantly restore or transfer your second brain across devices.
- **Single-File HTML:** Downloadable self-contained HTML file that runs anywhere without node or servers.

---

## 🛠️ Tech Stack

- **Client-Side LLM:** `@mlc-ai/web-llm` (WebGPU)
- **Vector Embeddings:** `@huggingface/transformers` (`Xenova/all-MiniLM-L6-v2`)
- **Document Processing:** `pdf.js` (`pdfjs-dist`)
- **Vector & Chat Storage:** Browser `IndexedDB` API
- **Voice Engine:** Web Speech API (`SpeechRecognition` & `SpeechSynthesis`)
- **Web Research:** Wikipedia MediaWiki API
- **UI & Styling:** Tailwind CSS + Lucide Icons + Cyber HUD Holographic Theme
- **PWA Standards:** Service Worker (`sw.js`) + Web App Manifest (`manifest.webmanifest`)

---

## 📲 How to Install as a PWA

1. Open the app in any modern browser (Chrome, Edge, Brave, or Safari).
2. Click the **"Install PWA"** button in the header (or the browser's install icon in the URL bar).
3. The app installs to your desktop or mobile home screen as a standalone application.
4. Launch anytime — even when in Airplane Mode or with zero Wi-Fi!

---

## 🚀 Publishing on GitHub Pages

This repository is pre-configured for GitHub Pages deployment directly from the `main` branch with zero build configuration needed.

### Step-by-Step GitHub Pages Deployment:

1. **Push Repository to GitHub:**
   - In AI Studio, open the **Version Control / GitHub** tab.
   - Click **Push to GitHub** (or connect your GitHub repository).
   - Commit all files including `index.html`, `.nojekyll`, `public/`, and `README.md`.

2. **Configure GitHub Pages in GitHub Settings:**
   - Go to your repository on GitHub: `https://github.com/<your-username>/<repo-name>`.
   - Click **Settings** (top right tab).
   - In the left sidebar, click **Pages**.
   - Under **Build and deployment**:
     - **Source**: Select `Deploy from a branch`.
     - **Branch**: Select `main` (or `master`) and folder `/(root)`.
     - Click **Save**.

3. **Verify Deployment:**
   - Wait 1–2 minutes. GitHub Pages will display your live URL:
     `https://<your-username>.github.io/<repo-name>/`
   - Your second brain is now live and accessible from anywhere in the world!

---

## 🔒 Privacy Guarantee

- **No Analytics / Telemetry:** No user data is tracked.
- **No Paid APIs:** Zero calls to OpenAI, Gemini, or third-party paid services.
- **Client-Authoritative:** All embeddings, chats, and documents reside exclusively inside your device's browser `IndexedDB`. The only outgoing network requests are Wikipedia search queries when agentic search is triggered.

---

## 📬 Author & Feedback

Built with passion by **Waseem Asif**.  
- **Email:** [wasimasif761@gmail.com](mailto:wasimasif761@gmail.com)  
- **Issues & Contributions:** Pull requests and feature suggestions are welcome!
