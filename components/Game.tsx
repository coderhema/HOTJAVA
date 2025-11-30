
import React, { useState, useEffect } from 'react';
import { Challenge, ChallengeMode } from '../types';
import { Heart, Check, X, HelpCircle } from 'lucide-react';
import { playSound } from '../utils/audio';

interface GameProps {
  challenges: Challenge[];
  mode: ChallengeMode;
  roomCode: string;
  initialHearts: number;
  onFinish: (xp: number) => void;
  onExit: () => void;
}

const Game: React.FC<GameProps> = ({ challenges, mode, roomCode, initialHearts, onFinish, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hearts, setHearts] = useState(initialHearts);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(1);
  const [userInputs, setUserInputs] = useState<string[]>([]);
  const [fullCodeInput, setFullCodeInput] = useState('');
  
  // Feedback state
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [showSolution, setShowSolution] = useState(false);

  const currentChallenge = challenges[currentIndex];
  const isFinished = currentIndex >= challenges.length;
  
  // Reset state on new question
  useEffect(() => {
    if (currentChallenge) {
      setUserInputs(new Array(currentChallenge.expectedGaps.length).fill(''));
      setFullCodeInput('');
      setFeedbackStatus('idle');
      setShowSolution(false);
    }
  }, [currentIndex, currentChallenge]);

  // Handle Game Over or Finish
  useEffect(() => {
    if (hearts <= 0) {
      setTimeout(() => onFinish(xp), 1000);
    } else if (isFinished) {
      onFinish(xp);
    }
  }, [hearts, isFinished, onFinish, xp]);

  if (isFinished || hearts <= 0) return null;

  const handleCheck = () => {
    playSound('click');
    let isCorrect = false;

    if (mode === ChallengeMode.FILL_GAPS) {
      // Validate gaps
      isCorrect = currentChallenge.expectedGaps.every((ans, i) => 
        (userInputs[i] || '').trim().toLowerCase() === ans.trim().toLowerCase()
      );
    } else {
      // Validate full code (Fuzzy Match: normalize spaces)
      const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();
      const userNorm = normalize(fullCodeInput);
      const solNorm = normalize(currentChallenge.fullSolution);
      isCorrect = userNorm === solNorm;
    }

    if (isCorrect) {
      playSound('success');
      setFeedbackStatus('correct');
      setXp(prev => prev + 10 + (streak > 2 ? 5 : 0));
      setStreak(prev => prev + 1);
    } else {
      playSound('error');
      setFeedbackStatus('incorrect');
      setHearts(prev => Math.max(0, prev - 1));
      setStreak(0);
    }
  };

  const handleNext = () => {
    playSound('click');
    setCurrentIndex(prev => prev + 1);
  };

  const handleExitGame = () => {
    playSound('click');
    onExit();
  };

  // Render the Code with Gaps
  const renderGapCode = () => {
    const parts = currentChallenge.codeWithGaps.split('__GAP__');
    return (
      <div className="font-mono text-sm md:text-base leading-loose whitespace-pre-wrap">
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            <span className="text-stone-700">{part}</span>
            {i < parts.length - 1 && (
              <input
                type="text"
                value={userInputs[i] || ''}
                onChange={(e) => {
                  const newInputs = [...userInputs];
                  newInputs[i] = e.target.value;
                  setUserInputs(newInputs);
                }}
                disabled={feedbackStatus !== 'idle'}
                className={`mx-1 px-2 py-1 rounded border-b-2 outline-none w-24 md:w-32 text-center font-bold bg-white transition-all
                  ${feedbackStatus === 'correct' ? 'border-green-500 text-green-600 bg-green-50' : ''}
                  ${feedbackStatus === 'incorrect' ? 'border-red-500 text-red-600 bg-red-50' : ''}
                  ${feedbackStatus === 'idle' ? 'border-stone-300 focus:border-orange-500 focus:bg-orange-50' : ''}
                `}
                placeholder="..."
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const progressPercentage = ((currentIndex) / challenges.length) * 100;

  return (
    <div className="flex flex-col h-full w-full max-w-2xl mx-auto overflow-hidden relative">
      {/* Header */}
      <div className="flex-none flex items-center justify-between p-4 bg-white/50 backdrop-blur-sm z-10 border-b border-stone-100">
         <button onClick={handleExitGame} className="text-stone-400 hover:text-stone-600">
            <X className="w-6 h-6" />
         </button>
         
         {/* Progress Bar & Room Info */}
         <div className="flex-1 mx-4 flex flex-col justify-center">
            <div className="h-4 bg-stone-200 rounded-full overflow-hidden relative mb-1">
                <div 
                    className="h-full bg-orange-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                />
                 <div className="absolute top-1 left-2 right-2 h-1 bg-white/20 rounded-full"></div>
            </div>
            <div className="flex justify-center">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest bg-stone-100 px-2 rounded-full">
                Room: {roomCode}
              </span>
            </div>
         </div>

         <div className="flex items-center text-red-500 font-bold animate-pulse">
            <Heart className="w-6 h-6 fill-current mr-1" />
            <span>{hearts}</span>
         </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        <h2 className="text-2xl font-extrabold text-stone-700 mb-2">
          {currentChallenge.question}
        </h2>
        <p className="text-stone-500 mb-6 font-medium">
          {currentChallenge.description}
        </p>

        {/* Code Area */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-stone-200 overflow-hidden relative">
           <div className="absolute top-0 left-0 right-0 bg-stone-100 border-b border-stone-200 px-4 py-2 flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <span className="ml-2 text-xs text-stone-400 font-mono">editor.js — {mode === ChallengeMode.FILL_GAPS ? 'Fill Gaps' : 'Full Code'}</span>
           </div>
           
           <div className="p-6 pt-12 min-h-[200px] bg-stone-50">
              {mode === ChallengeMode.FILL_GAPS ? (
                renderGapCode()
              ) : (
                <textarea 
                  className={`w-full h-48 md:h-64 bg-transparent resize-none outline-none font-mono text-sm md:text-base leading-relaxed code-font
                    ${feedbackStatus === 'incorrect' ? 'text-red-600' : 'text-stone-800'}
                  `}
                  placeholder="// Type your solution here..."
                  value={fullCodeInput}
                  onChange={(e) => setFullCodeInput(e.target.value)}
                  disabled={feedbackStatus !== 'idle'}
                  spellCheck={false}
                  autoCapitalize="off"
                />
              )}
           </div>
           
           {/* Hint / Helper for Write Full Mode */}
           {mode === ChallengeMode.WRITE_FULL && feedbackStatus === 'idle' && (
             <div className="bg-yellow-50 px-4 py-2 text-yellow-700 text-sm border-t border-yellow-100 flex items-center">
                <HelpCircle className="w-4 h-4 mr-2" />
                <span>Need help? Try to recall the syntax for "{currentChallenge.topic}".</span>
             </div>
           )}
        </div>
      </div>

      {/* Footer / Feedback Action Area */}
      <div className={`flex-none p-4 md:p-6 transition-all duration-300 border-t-2 z-20 
          ${feedbackStatus === 'idle' ? 'bg-white border-stone-200' : ''}
          ${feedbackStatus === 'correct' ? 'bg-green-100 border-green-200' : ''}
          ${feedbackStatus === 'incorrect' ? 'bg-red-100 border-red-200' : ''}
      `}>
         <div className="max-w-2xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Feedback Message */}
            <div className="flex-1">
               {feedbackStatus === 'correct' && (
                 <div className="flex items-center text-green-700">
                    <div className="bg-green-500 rounded-full p-2 mr-3 text-white">
                       <Check className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-xl">Excellent!</h3>
                        <p className="text-green-600 text-sm">{currentChallenge.explanation}</p>
                    </div>
                 </div>
               )}
               
               {feedbackStatus === 'incorrect' && (
                 <div className="flex flex-col text-red-700">
                    <div className="flex items-center mb-2">
                        <div className="bg-red-500 rounded-full p-2 mr-3 text-white">
                           <X className="w-6 h-6" />
                        </div>
                        <h3 className="font-extrabold text-xl">Not quite right...</h3>
                    </div>
                    
                    {!showSolution ? (
                        <button 
                          onClick={() => { playSound('click'); setShowSolution(true); }}
                          className="text-red-600 underline text-sm font-bold self-start ml-12 hover:text-red-800"
                        >
                          Show Solution
                        </button>
                    ) : (
                        <div className="ml-12 mt-1 p-3 bg-red-200/50 rounded-lg text-sm font-mono whitespace-pre-wrap">
                            {currentChallenge.fullSolution}
                        </div>
                    )}
                 </div>
               )}
            </div>

            {/* Action Button */}
            <button
               onClick={feedbackStatus === 'idle' ? handleCheck : handleNext}
               className={`
                  w-full md:w-auto px-8 py-3 rounded-2xl font-extrabold text-white text-lg uppercase tracking-wide shadow-[0_4px_0_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-1 transition-all
                  ${feedbackStatus === 'idle' 
                    ? 'bg-orange-500 hover:bg-orange-400 shadow-orange-700' 
                    : ''}
                  ${feedbackStatus === 'correct' 
                    ? 'bg-green-500 hover:bg-green-400 shadow-green-700' 
                    : ''}
                  ${feedbackStatus === 'incorrect' 
                    ? 'bg-red-500 hover:bg-red-400 shadow-red-700' 
                    : ''}
               `}
            >
               {feedbackStatus === 'idle' ? 'Check' : (currentIndex === challenges.length - 1 ? 'Finish' : 'Continue')}
            </button>
         </div>
      </div>
    </div>
  );
};

export default Game;
