
import { useCallback } from 'react';

// Simple synthesized sounds to avoid external dependencies for now
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

const playTone = (freq, type, duration) => {
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioContext.currentTime);
  
  gain.gain.setValueAtTime(0.1, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
  
  osc.connect(gain);
  gain.connect(audioContext.destination);
  
  osc.start();
  osc.stop(audioContext.currentTime + duration);
};

export const useSound = () => {
    
  const playHover = useCallback(() => {
    if (audioContext.state === 'suspended') audioContext.resume();
    playTone(400, 'sine', 0.1);
  }, []);

  const playClick = useCallback(() => {
    if (audioContext.state === 'suspended') audioContext.resume();
    playTone(600, 'sine', 0.15);
  }, []);

  const playSuccess = useCallback(() => {
    if (audioContext.state === 'suspended') audioContext.resume();
    // Simulate a cheerful arpeggio
    setTimeout(() => playTone(500, 'sine', 0.2), 0);
    setTimeout(() => playTone(600, 'sine', 0.2), 100);
    setTimeout(() => playTone(800, 'sine', 0.4), 200);
  }, []);

  return { playHover, playClick, playSuccess };
};
