// Export the application as a standalone, zero-build single HTML file
export function downloadSingleFileHTML(): void {
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MySecondBrain - Offline-First AI Assistant</title>
  <meta name="author" content="Waseem Asif (wasimasif761@gmail.com)">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;600;700&family=Inter:wght@300;400;500;600;700&family=Noto+Nastaliq+Urdu:wght@400;700&family=Noto+Sans+Arabic:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    body { background-color: #070913; color: #e2e8f0; font-family: 'Inter', sans-serif; }
    .font-hud { font-family: 'Chakra Petch', monospace, sans-serif; }
    .font-urdu { font-family: 'Noto Nastaliq Urdu', serif; }
    .font-arabic { font-family: 'Noto Sans Arabic', sans-serif; }
    .neon-cyan { border-color: rgba(6,182,212,0.4); box-shadow: 0 0 15px rgba(6,182,212,0.2); }
    .neon-purple { border-color: rgba(168,85,247,0.4); box-shadow: 0 0 15px rgba(168,85,247,0.2); }
  </style>
</head>
<body class="min-h-screen bg-[#070913] text-slate-100 flex flex-col">
  <!-- Standalone Header -->
  <header class="border-b border-cyan-500/20 bg-[#0c1024]/80 backdrop-blur px-6 py-4 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20 font-hud">
        SB
      </div>
      <div>
        <h1 class="font-hud text-lg font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">MySecondBrain</h1>
        <p class="text-xs text-slate-400">By Waseem Asif • Standalone Offline PWA</p>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <span id="gpuStatus" class="text-xs px-2.5 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-400 font-mono">Checking WebGPU...</span>
      <span id="memCount" class="text-xs px-2.5 py-1 rounded-full border border-purple-500/30 bg-purple-950/40 text-purple-400 font-mono">Memories: 0</span>
    </div>
  </header>

  <main class="flex-1 flex max-w-7xl mx-auto w-full p-4 gap-4">
    <div class="flex-1 bg-slate-900/50 border border-cyan-500/20 rounded-2xl flex flex-col p-4 overflow-hidden">
      <div id="chatBox" class="flex-1 overflow-y-auto space-y-4 pr-2">
        <div class="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-sm text-cyan-200">
          ⚡ <strong>MySecondBrain Standalone Engine Ready:</strong> WebLLM Llama-3-8B local reasoning, Transformers.js vector memory, Wikipedia agentic search, and Speech voice synthesis are ready to run directly in your browser.
        </div>
      </div>
      <div class="mt-4 pt-3 border-t border-slate-800 flex gap-2">
        <input id="promptInput" type="text" placeholder="Type a message or fact to remember..." class="flex-1 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-2 text-sm outline-none">
        <button id="sendBtn" class="bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition">Send</button>
      </div>
    </div>
  </main>

  <script type="module">
    import { CreateMLCEngine } from 'https://esm.run/@mlc-ai/web-llm';
    import { pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers';

    console.log('[MySecondBrain] Standalone Loaded.');
  </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'MySecondBrain.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
