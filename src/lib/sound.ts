// Sound utility to play a satisfying, premium rising arpeggio task completion sound
export const playBellChime = () => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    // Ascending A-major chord notes: E5 -> A5 -> C#6 (warm, premium, rewarding arpeggio)
    const notes = [659.25, 880.00, 1109.73];
    
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      // Delay notes slightly (60ms interval) to build the rising sweep
      const startTime = now + index * 0.06;
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, startTime); // pleasant volume swell
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.45);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + 0.5);
    });
  } catch (e) {
    console.warn('Audio play blocked or unsupported by browser:', e);
  }
};
