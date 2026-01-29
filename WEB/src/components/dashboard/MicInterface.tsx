import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useUser } from '@/context/UserContext';
import { Send, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CaretakerDashboard from './CaretakerDashboard';

// Friend's server URL
const FRIEND_SERVER_URL = "http://172.16.1.41:8000";

export default function MicInterface() {
  const { triggerEmergency } = useApp();
  const { profile } = useUser();

  // Text chat with friend's server
  const [textInput, setTextInput] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  if (profile.role === 'caretaker') {
    return <CaretakerDashboard />;
  }

  const sendTextMessage = async () => {
    if (!textInput.trim() || isLoading) return;

    setIsLoading(true);
    setError('');
    setChatResponse('');

    try {
      const response = await fetch(`${FRIEND_SERVER_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: textInput }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from server');
      }

      const data = await response.json();
      const reply = data.reply || 'No response received';
      setChatResponse(reply);
      setTextInput(''); // Clear input after successful send

      // Convert text to speech
      speakText(reply);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to server');
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const speakText = (text: string) => {
    // Check if browser supports speech synthesis
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0; // Normal speed
      utterance.pitch = 1.0; // Normal pitch
      utterance.volume = 1.0; // Full volume

      // Optional: Set voice (you can customize this)
      const voices = window.speechSynthesis.getVoices();
      // Try to find a female voice or use default
      const preferredVoice = voices.find(voice => voice.name.includes('Female')) || voices[0];
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      // Track speaking state
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('Text-to-speech not supported in this browser');
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-md">
      {/* Text Input Box */}
      <div className="w-full space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendTextMessage()}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          />
          <button
            onClick={sendTextMessage}
            disabled={!textInput.trim() || isLoading}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
          >
            {isLoading ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Response Display */}
        <AnimatePresence>
          {chatResponse && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="care-card bg-primary/5 border-primary/20"
            >
              <p className="text-sm font-medium text-muted-foreground mb-1">Kutty:</p>
              <p className="text-foreground mb-3">{chatResponse}</p>

              {/* Stop Audio Button */}
              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <VolumeX className="w-4 h-4" />
                  Stop Audio
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="care-card bg-red-50 border-red-200"
            >
              <p className="text-sm text-red-600">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SOS Button */}
      <button
        onClick={triggerEmergency}
        className="mt-8 px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-xl shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
      >
        SOS
      </button>
    </div>
  );
}
