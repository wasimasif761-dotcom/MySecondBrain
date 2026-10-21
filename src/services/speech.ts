import { LanguageId } from '../types';

export const LANGUAGE_SPEECH_CODES: Record<LanguageId, { stt: string; tts: string; fallbackTts: string }> = {
  urdu: { stt: 'ur-PK', tts: 'ur-PK', fallbackTts: 'hi-IN' },
  'roman-urdu': { stt: 'en-US', tts: 'en-US', fallbackTts: 'en-GB' },
  arabic: { stt: 'ar-SA', tts: 'ar-SA', fallbackTts: 'ar' },
  hindi: { stt: 'hi-IN', tts: 'hi-IN', fallbackTts: 'hi' },
  english: { stt: 'en-US', tts: 'en-US', fallbackTts: 'en-GB' },
};

// Check if Speech Recognition is supported
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

// Create and configure a speech recognition session
export function startVoiceRecognition({
  language,
  onResult,
  onError,
  onEnd,
}: {
  language: LanguageId;
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (errorText: string) => void;
  onEnd: () => void;
}): { stop: () => void; abort: () => void } | null {
  if (!isSpeechRecognitionSupported()) {
    onError('Speech recognition is not supported in this browser. Try Google Chrome or Edge.');
    return null;
  }

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  const langCode = LANGUAGE_SPEECH_CODES[language]?.stt || 'en-US';
  recognition.lang = langCode;
  recognition.continuous = false;
  recognition.interimResults = true;

  recognition.onresult = (event: any) => {
    let interim = '';
    let final = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const item = event.results[i];
      if (item.isFinal) {
        final += item[0].transcript;
      } else {
        interim += item[0].transcript;
      }
    }

    if (final) {
      onResult(final.trim(), true);
    } else if (interim) {
      onResult(interim.trim(), false);
    }
  };

  recognition.onerror = (event: any) => {
    let msg = 'Voice recognition error';
    if (event.error === 'not-allowed') {
      msg = 'Microphone access denied. Please click the camera/microphone icon in your URL bar to grant access.';
    } else if (event.error === 'no-speech') {
      msg = 'No speech was detected. Please speak into your microphone.';
    } else if (event.error === 'network') {
      msg = 'Network issue occurred during speech recognition.';
    }
    onError(msg);
  };

  recognition.onend = () => {
    onEnd();
  };

  try {
    recognition.start();
  } catch (err: any) {
    onError(err?.message || 'Could not start microphone.');
    return null;
  }

  return {
    stop: () => recognition.stop(),
    abort: () => recognition.abort(),
  };
}

// Clean markdown and citations for clean TTS speech
function cleanTextForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' Code snippet omitted. ') // remove code blocks
    .replace(/`([^`]+)`/g, '$1') // remove inline code ticks
    .replace(/\[\^?\d+\]/g, '') // remove citations [1]
    .replace(/\[Memory #\d+[^\]]*\]/g, '') // remove memory tags
    .replace(/[#*_~`]/g, '') // remove markdown symbols
    .replace(/\s+/g, ' ')
    .trim();
}

// Read text out loud via SpeechSynthesis
export function speakText(
  text: string,
  language: LanguageId,
  onStart?: () => void,
  onEnd?: () => void
): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const clean = cleanTextForSpeech(text);
  if (!clean) return false;

  const utterance = new SpeechSynthesisUtterance(clean);
  const langConfig = LANGUAGE_SPEECH_CODES[language];
  utterance.lang = langConfig.tts;
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  // Try to find matching voice
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find(
    (v) =>
      v.lang.toLowerCase().startsWith(langConfig.tts.toLowerCase()) ||
      v.lang.toLowerCase().startsWith(langConfig.fallbackTts.toLowerCase())
  );

  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();

  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeaking(): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  return window.speechSynthesis.speaking;
}
