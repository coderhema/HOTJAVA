
import React, { useState } from 'react';
import { GameState, Challenge, ChallengeMode } from './types';
import { generateChallenges } from './services/geminiService';
import Game from './components/Game';
import ThreeDCup from './components/ThreeDCup';
import { playSound } from './utils/audio';
import { Code, Zap, Trophy, Loader2, BookOpen, Users, Hash, Copy } from 'lucide-react';

const generateRoomCode = () => Math.random().toString(36).substring(2, 7).toUpperCase();

const stringToSeed = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
  }
  return Math.abs(hash);
};

const App: React.FC = () => {
  const [status, setStatus] = useState<GameState['status']>('LANDING');
  const [topic, setTopic] = useState('');
  const [mode, setMode] = useState<ChallengeMode>(ChallengeMode.FILL_GAPS);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [earnedXp, setEarnedXp] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Multiplayer / Session State
  const [sessionType, setSessionType] = useState<'HOST' | 'JOIN'>('HOST');
  const [roomCode, setRoomCode] = useState(generateRoomCode());

  const handleStart = async () => {
    playSound('click');
    if (!topic.trim() || !roomCode.trim()) return;
    
    setStatus('LOADING');
    setError(null);
    try {
      // Use the roomCode as a seed for deterministic generation
      const seed = stringToSeed(roomCode.trim().toUpperCase());
      const generated = await generateChallenges(topic, 5, seed);
      setChallenges(generated);
      setStatus('PLAYING');
    } catch (e) {
      console.error(e);
      setError("We couldn't brew your challenges. Please check your connection or try a specific topic.");
      setStatus('LANDING');
    }
  };

  const handleFinish = (xp: number) => {
    setEarnedXp(xp);
    setStatus('RESULT');
  };

  const handleExit = () => {
    playSound('click');
    setStatus('LANDING');
    setTopic('');
    setEarnedXp(0);
    // Regenerate code for a fresh start if we were hosting
    if (sessionType === 'HOST') {
      setRoomCode(generateRoomCode());
    } else {
      setRoomCode('');
    }
  };

  const copyToClipboard = () => {
    playSound('click');
    navigator.clipboard.writeText(`${topic.trim()} ${roomCode}`);
  };

  return (
    <div className="h-[100dvh] bg-orange-50 text-stone-800 font-sans selection:bg-orange-200 overflow-hidden flex flex-col">
      
      {/* LANDING PAGE */}
      {status === 'LANDING' && (
        <div className="flex-1 overflow-y-auto w-full">
          <div className="max-w-md mx-auto min-h-full flex flex-col justify-center p-6">
            <div className="text-center mb-4 flex flex-col items-center">
               <ThreeDCup />
               <h1 className="text-3xl font-extrabold text-stone-800 tracking-tight mb-1 mt-2">HOTJAVA</h1>
               <p className="text-stone-500 font-medium text-base">Brew your code skills.</p>
                <p className="text-stone-400 font-bold text-xs mt-2">
                    Made by <a href="http://x.com/coderhema" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-600 transition-colors">@coderhema</a>
                </p>
            </div>

            <div className="bg-white rounded-3xl overflow-hidden shadow-xl border-2 border-stone-100">
              {/* Tabs */}
              <div className="flex border-b-2 border-stone-100">
                <button 
                  onClick={() => { playSound('click'); setSessionType('HOST'); setRoomCode(generateRoomCode()); }}
                  className={`flex-1 py-4 font-extrabold uppercase tracking-wide text-sm flex items-center justify-center space-x-2 transition-colors
                    ${sessionType === 'HOST' ? 'bg-orange-50 text-orange-600' : 'bg-white text-stone-400 hover:text-stone-600'}
                  `}
                >
                  <Zap className="w-4 h-4" />
                  <span>Create</span>
                </button>
                <button 
                  onClick={() => { playSound('click'); setSessionType('JOIN'); setRoomCode(''); }}
                  className={`flex-1 py-4 font-extrabold uppercase tracking-wide text-sm flex items-center justify-center space-x-2 transition-colors
                    ${sessionType === 'JOIN' ? 'bg-blue-50 text-blue-600' : 'bg-white text-stone-400 hover:text-stone-600'}
                  `}
                >
                  <Users className="w-4 h-4" />
                  <span>Join</span>
                </button>
              </div>

              <div className="p-6 space-y-6">
                
                {/* Common Input: Topic */}
                <div>
                  <label className="block text-stone-400 font-bold uppercase text-xs tracking-wider mb-2">
                    {sessionType === 'HOST' ? 'What do you want to learn?' : "Host's Topic"}
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={sessionType === 'HOST' ? "e.g. React Hooks" : "Must match Host's topic"}
                    className="w-full bg-stone-100 text-stone-800 font-bold text-lg p-4 rounded-xl border-2 border-stone-200 focus:border-orange-500 focus:bg-white outline-none transition-colors"
                  />
                </div>

                {/* Room Code */}
                <div>
                  <label className="block text-stone-400 font-bold uppercase text-xs tracking-wider mb-2">
                     {sessionType === 'HOST' ? 'Set Join Code' : 'Enter Join Code'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Hash className="h-5 w-5 text-stone-400" />
                    </div>
                    <input
                      type="text"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      placeholder="CODE"
                      className={`w-full bg-stone-100 font-mono text-stone-800 font-bold text-lg py-4 pl-12 pr-4 rounded-xl border-2 border-stone-200 outline-none transition-colors uppercase tracking-widest
                         ${sessionType === 'HOST' ? 'focus:border-orange-500 focus:bg-white' : 'focus:border-blue-500 focus:bg-white'}
                      `}
                    />
                    {sessionType === 'HOST' && (
                       <button onClick={copyToClipboard} className="absolute inset-y-0 right-0 pr-4 flex items-center text-stone-400 hover:text-orange-500">
                          <Copy className="h-5 w-5" />
                       </button>
                    )}
                  </div>
                  {sessionType === 'HOST' && (
                    <p className="text-xs text-stone-400 mt-2 font-medium">
                      Share this code (and the topic!) with friends to play the same challenges.
                    </p>
                  )}
                   {sessionType === 'JOIN' && (
                    <p className="text-xs text-stone-400 mt-2 font-medium">
                      Ensure the Topic and Code match the host's exactly.
                    </p>
                  )}
                </div>

                {/* Mode Selection */}
                <div>
                  <label className="block text-stone-400 font-bold uppercase text-xs tracking-wider mb-2">Challenge Mode</label>
                  <div className="grid grid-cols-2 gap-3 p-1 bg-stone-100 rounded-xl">
                    <button 
                      onClick={() => { playSound('click'); setMode(ChallengeMode.FILL_GAPS); }}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg font-bold transition-all ${mode === ChallengeMode.FILL_GAPS ? 'bg-white shadow text-orange-600' : 'text-stone-400 hover:text-stone-600'}`}
                    >
                      <BookOpen className="w-6 h-6 mb-1" />
                      <span className="text-sm">Fill Gaps</span>
                    </button>
                    <button 
                      onClick={() => { playSound('click'); setMode(ChallengeMode.WRITE_FULL); }}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg font-bold transition-all ${mode === ChallengeMode.WRITE_FULL ? 'bg-white shadow text-orange-600' : 'text-stone-400 hover:text-stone-600'}`}
                    >
                      <Code className="w-6 h-6 mb-1" />
                      <span className="text-sm">Write Code</span>
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-100 text-red-600 rounded-xl text-sm font-bold flex items-center">
                    <span className="mr-2">⚠️</span> {error}
                  </div>
                )}

                <button
                  onClick={handleStart}
                  disabled={!topic.trim() || !roomCode.trim()}
                  className={`w-full py-4 rounded-2xl font-extrabold text-xl uppercase tracking-wide shadow-[0_6px_0_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-1.5 transition-all
                     ${topic.trim() && roomCode.trim()
                        ? (sessionType === 'HOST' ? 'bg-orange-500 text-white shadow-orange-700 hover:bg-orange-400' : 'bg-blue-500 text-white shadow-blue-700 hover:bg-blue-400')
                        : 'bg-stone-300 text-stone-400 shadow-stone-400 cursor-not-allowed'}
                  `}
                >
                  {sessionType === 'HOST' ? 'Start Session' : 'Join Session'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOADING STATE */}
      {status === 'LOADING' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
           <Loader2 className={`w-16 h-16 animate-spin mb-6 ${sessionType === 'HOST' ? 'text-orange-500' : 'text-blue-500'}`} />
           <h2 className="text-2xl font-extrabold text-stone-700">
             {sessionType === 'HOST' ? 'Brewing fresh challenges...' : 'Syncing with host...'}
           </h2>
           <p className="text-stone-400 mt-2 font-medium">Using code: <span className="font-mono text-stone-600 font-bold">{roomCode}</span></p>
           
           <div className="mt-8 flex space-x-2">
              <span className={`w-3 h-3 rounded-full animate-bounce [animation-delay:-0.3s] ${sessionType === 'HOST' ? 'bg-orange-300' : 'bg-blue-300'}`}></span>
              <span className={`w-3 h-3 rounded-full animate-bounce [animation-delay:-0.15s] ${sessionType === 'HOST' ? 'bg-orange-400' : 'bg-blue-400'}`}></span>
              <span className={`w-3 h-3 rounded-full animate-bounce ${sessionType === 'HOST' ? 'bg-orange-500' : 'bg-blue-500'}`}></span>
           </div>
        </div>
      )}

      {/* GAME STATE */}
      {status === 'PLAYING' && (
        <Game
          challenges={challenges}
          mode={mode}
          roomCode={roomCode}
          initialHearts={5}
          onFinish={handleFinish}
          onExit={handleExit}
        />
      )}

      {/* RESULT STATE */}
      {status === 'RESULT' && (
        <div className="flex-1 overflow-y-auto w-full">
          <div className="flex flex-col items-center justify-center min-h-full p-6 max-w-md mx-auto text-center">
             <div className="mb-8 relative">
                <div className="absolute inset-0 bg-yellow-400 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                <Trophy className="w-32 h-32 text-yellow-500 relative z-10 drop-shadow-md" strokeWidth={1.5} />
             </div>
             
             <h2 className="text-4xl font-extrabold text-stone-800 mb-2">Lesson Complete!</h2>
             
             <div className="grid grid-cols-2 gap-4 w-full mb-8">
                <div className="bg-orange-100 p-4 rounded-2xl border-2 border-orange-200">
                   <div className="text-orange-500 font-bold uppercase text-xs mb-1">Total XP</div>
                   <div className="text-3xl font-extrabold text-orange-600 flex items-center justify-center">
                      <Zap className="w-6 h-6 mr-1 fill-current" />
                      {earnedXp}
                   </div>
                </div>
                <div className="bg-blue-100 p-4 rounded-2xl border-2 border-blue-200">
                   <div className="text-blue-500 font-bold uppercase text-xs mb-1">Room</div>
                   <div className="text-lg font-mono font-extrabold text-blue-600 truncate px-2">
                      {roomCode}
                   </div>
                </div>
             </div>

             <button
               onClick={handleExit}
               className="w-full py-4 rounded-2xl font-extrabold text-xl text-white bg-orange-500 uppercase tracking-wide shadow-[0_6px_0_0_rgba(194,65,12,1)] active:shadow-none active:translate-y-1.5 transition-all hover:bg-orange-400"
             >
               Continue
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
