
const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
let ctx: AudioContext | null = null;

const getContext = () => {
  if (!ctx) {
    ctx = new AudioContext();
  }
  return ctx;
};

export const playSound = (type: 'click' | 'success' | 'error' | 'pop') => {
  const context = getContext();
  if (context.state === 'suspended') {
    context.resume();
  }

  const t = context.currentTime;
  const osc = context.createOscillator();
  const gain = context.createGain();

  osc.connect(gain);
  gain.connect(context.destination);

  switch (type) {
    case 'click':
      // High pitched blip
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(400, t + 0.1);
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.start(t);
      osc.stop(t + 0.1);
      break;

    case 'pop':
      // Bubbly pop sound
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.linearRampToValueAtTime(600, t + 0.05);
      osc.frequency.linearRampToValueAtTime(100, t + 0.15);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.start(t);
      osc.stop(t + 0.15);
      break;

    case 'success':
      // Major arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C
      notes.forEach((freq, i) => {
        const oscNode = context.createOscillator();
        const gainNode = context.createGain();
        oscNode.connect(gainNode);
        gainNode.connect(context.destination);
        
        oscNode.type = 'triangle';
        oscNode.frequency.value = freq;
        
        const startTime = t + i * 0.08;
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.05, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
        
        oscNode.start(startTime);
        oscNode.stop(startTime + 0.3);
      });
      break;

    case 'error':
      // Low buzz/thud
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.linearRampToValueAtTime(100, t + 0.2);
      
      // Add some wobble
      const lfo = context.createOscillator();
      lfo.frequency.value = 20;
      const lfoGain = context.createGain();
      lfoGain.gain.value = 500;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(t);
      lfo.stop(t + 0.3);

      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.3);
      break;
  }
};
