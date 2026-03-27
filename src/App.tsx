/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Star, RefreshCw, Timer, Rocket, ArrowLeft, ArrowRight, Users, MapPin, Flag } from 'lucide-react';
import confetti from 'canvas-confetti';
import { MAIN_CHARACTER, GROWTH_MESSAGES, SUCCESS_THRESHOLD, LEVELS } from './constants';
import { Problem, GameState, LevelConfig } from './types';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [correctInLevel, setCorrectInLevel] = useState(0);
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [characterPos, setCharacterPos] = useState(1); // 0: Left, 1: Center, 2: Right
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isProcessing, setIsProcessing] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const generateProblem = useCallback((currentLevel: number) => {
    let base = 100;
    let num = 0;
    let type: 'multiply' | 'divide' = Math.random() > 0.5 ? 'multiply' : 'divide';

    // Level 1: simple with 100
    if (currentLevel === 1) {
      base = 100;
      num = Math.floor(Math.random() * 9) + 1; // 1-9
      if (type === 'divide') num *= 100;
    } 
    // Level 2: with 1000
    else if (currentLevel === 2) {
      base = 1000;
      num = Math.floor(Math.random() * 9) + 1; // 1-9
      if (type === 'divide') num *= 1000;
    } 
    // Level 3: combined and larger numbers
    else if (currentLevel === 3) {
      base = Math.random() > 0.5 ? 100 : 1000;
      num = Math.floor(Math.random() * 89) + 10; // 10-99
      if (type === 'divide') num *= base;
    }
    // Level 4: Decimal division by 10, 100, 1000
    else if (currentLevel === 4) {
      base = [10, 100, 1000][Math.floor(Math.random() * 3)];
      // Generate a decimal number like 3.5, 45.6, 7.89
      num = parseFloat((Math.random() * 99 + 1).toFixed(Math.floor(Math.random() * 2) + 1));
      type = 'divide'; // Focus on decimal division as requested
    }
    // Level 5: fast operations with decimals
    else if (currentLevel === 5) {
      base = [10, 100, 1000][Math.floor(Math.random() * 3)];
      num = parseFloat((Math.random() * 999 + 1).toFixed(Math.floor(Math.random() * 2) + 1));
      type = Math.random() > 0.5 ? 'multiply' : 'divide';
    }
    // Level 6: final race with complex decimals
    else {
      base = [10, 100, 1000][Math.floor(Math.random() * 3)];
      num = parseFloat((Math.random() * 9999 + 1).toFixed(Math.floor(Math.random() * 3) + 1));
      type = Math.random() > 0.5 ? 'multiply' : 'divide';
    }

    const answer = type === 'multiply' ? num * base : num / base;
    // Format answer to avoid floating point issues
    const formattedAnswer = parseFloat(answer.toFixed(4));
    const question = `${num} ${type === 'multiply' ? '×' : '÷'} ${base}`;

    const options = new Set<number>();
    options.add(formattedAnswer);
    
    // Closer distractors for higher levels
    while (options.size < 3) {
      let wrong;
      if (currentLevel >= 4) {
        // Distractors that are off by one decimal place or small addition
        const shift = [0.1, 10, 100, 0.01, 1000][Math.floor(Math.random() * 5)];
        wrong = parseFloat((formattedAnswer * shift).toFixed(4));
        if (Math.random() > 0.7) {
          const offset = [0.1, 0.01, 1, 10][Math.floor(Math.random() * 4)];
          wrong = parseFloat((formattedAnswer + (Math.random() > 0.5 ? offset : -offset)).toFixed(4));
        }
      } else {
        const shift = [0.1, 10, 100, 0.01, 1000][Math.floor(Math.random() * 5)];
        wrong = parseFloat((formattedAnswer * shift).toFixed(2));
      }
      
      if (wrong !== formattedAnswer && !isNaN(wrong) && wrong > 0) options.add(wrong);
    }

    setCurrentProblem({
      id: Math.random().toString(),
      question,
      answer: formattedAnswer,
      options: Array.from(options).sort(() => Math.random() - 0.5),
      level: currentLevel
    });
    setIsProcessing(false);
  }, []);

  useEffect(() => {
    if (gameState === 'PLAYING') {
      if (!currentProblem) generateProblem(level);

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setGameState('FINISHED');
            return 0;
          }
          // Level 5 is faster
          return level === 5 ? prev - 2 : prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, currentProblem, level, generateProblem]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'PLAYING' || isProcessing) return;
      if (e.key === 'ArrowLeft') {
        setCharacterPos(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCharacterPos(prev => Math.min(2, prev + 1));
      } else if (e.key === 'Enter' || e.key === ' ') {
        checkAnswer(characterPos);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, isProcessing, characterPos]);

  const checkAnswer = (index: number) => {
    if (!currentProblem || isProcessing) return;
    setIsProcessing(true);
    setCharacterPos(index);

    const selectedAnswer = currentProblem.options[index];
    const isCorrect = selectedAnswer === currentProblem.answer;

    if (isCorrect) {
      setScore(s => s + 100);
      setCorrectInLevel(c => c + 1);
      setFeedback({
        message: GROWTH_MESSAGES.success[Math.floor(Math.random() * GROWTH_MESSAGES.success.length)],
        type: 'success'
      });
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      setTimeout(() => {
        setFeedback(null);
        if (correctInLevel + 1 >= SUCCESS_THRESHOLD) {
          if (level < 6) {
            setGameState('LEVEL_UP');
          } else {
            setGameState('FINISHED');
          }
        } else {
          generateProblem(level);
        }
      }, 1500);
    } else {
      setFeedback({
        message: GROWTH_MESSAGES.error[Math.floor(Math.random() * GROWTH_MESSAGES.error.length)],
        type: 'error'
      });
      setTimeout(() => {
        setFeedback(null);
        setIsProcessing(false);
      }, 1500);
    }
  };

  const nextLevel = () => {
    setLevel(l => l + 1);
    setCorrectInLevel(0);
    setGameState('PLAYING');
    generateProblem(level + 1);
  };

  const startGame = () => {
    setGameState('PLAYING');
    setLevel(1);
    setScore(0);
    setCorrectInLevel(0);
    setTimeLeft(60);
    generateProblem(1);
  };

  const selectLevel = (lvl: number) => {
    setLevel(lvl);
    setCorrectInLevel(0);
    setGameState('PLAYING');
    generateProblem(lvl);
  };

  const currentLevelConfig = LEVELS[level - 1];

  return (
    <div className={`min-h-screen bg-gradient-to-b ${currentLevelConfig?.bgClass || 'from-[#0B0E14] to-black'} text-white font-sans overflow-hidden relative transition-colors duration-1000 flex`}>
      
      {/* Level Selection Menu (Sidebar) */}
      <aside className="w-24 bg-black/40 backdrop-blur-xl border-r border-white/10 flex flex-col items-center py-8 gap-4 z-30">
        <div className="mb-6 text-blue-400">
          <MapPin className="w-10 h-10" />
        </div>
        <div className="flex flex-col gap-4 items-center">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              onClick={() => selectLevel(l.id)}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-all duration-300 relative group ${
                level === l.id 
                  ? 'bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.6)] scale-110' 
                  : 'bg-white/5 hover:bg-white/10 grayscale hover:grayscale-0'
              }`}
            >
              {l.icon}
              
              {level === l.id && (
                <motion.div 
                  layoutId="activeLevel"
                  className="absolute -right-2 w-2 h-10 bg-blue-400 rounded-full"
                />
              )}

              {/* Tooltip - Larger XL Text */}
              <div className="absolute left-full ml-6 px-6 py-3 bg-white text-black text-xl font-black uppercase tracking-tighter rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-all duration-200 transform translate-x-[-10px] group-hover:translate-x-0 shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-50">
                {l.name}
                {/* Arrow */}
                <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-4 bg-white rotate-45 rounded-sm" />
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative">
        {/* Stars Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div 
            key={i}
            className="absolute bg-white rounded-full animate-pulse"
            style={{
              width: Math.random() * 3 + 'px',
              height: Math.random() * 3 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              opacity: Math.random(),
              animationDelay: Math.random() * 5 + 's'
            }}
          />
        ))}
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 h-screen flex flex-col relative z-10">
        
        {/* HUD */}
        {gameState === 'PLAYING' && (
          <div className="flex justify-between items-center bg-white/10 backdrop-blur-md p-6 rounded-[2rem] border border-white/20 mb-8 shadow-2xl">
            <div className="flex items-center gap-8">
              <div className="flex flex-col">
                <div className="flex items-center gap-3">
                  <Rocket className="text-blue-400 w-5 h-5" />
                  <span className="font-black text-lg uppercase tracking-widest">Nivel {level}: {currentLevelConfig.name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-blue-200 font-medium uppercase tracking-wider mt-1">
                  <Users className="w-4 h-4" />
                  <span>Rol: {currentLevelConfig.role}</span>
                </div>
              </div>
              <div className="h-12 w-px bg-white/20" />
              <div className="flex items-center gap-3">
                <Timer className={`w-6 h-6 ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`} />
                <span className={`font-mono text-3xl font-black ${timeLeft < 10 ? 'text-red-500' : ''}`}>{timeLeft}s</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">Puntaje</p>
              <p className="text-4xl font-black text-blue-400 tabular-nums">{score}</p>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {gameState === 'START' && (
            <motion.div 
              key="start"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-12"
            >
              <div className="space-y-6">
                <motion.div 
                  animate={{ y: [0, -30, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="text-[12rem] drop-shadow-[0_0_50px_rgba(59,130,246,0.5)]"
                >
                  {MAIN_CHARACTER.emoji}
                </motion.div>
                <h1 className="text-8xl font-black tracking-tighter bg-gradient-to-b from-white to-blue-400 bg-clip-text text-transparent uppercase leading-tight">
                  Misión Matemática <br /> en Equipo
                </h1>
                <p className="text-2xl text-blue-200 max-w-2xl mx-auto font-medium">
                  ¡Solo avanzando juntos como equipo podemos alcanzar la meta! Resuelve operaciones con 100 y 1000, ¡y ahora también con decimales!
                </p>
              </div>

              <button 
                onClick={startGame}
                className="group relative px-20 py-8 bg-blue-600 text-white rounded-full text-4xl font-black hover:bg-blue-500 transition-all shadow-[0_0_50px_rgba(37,99,235,0.6)] active:scale-95 hover:scale-105"
              >
                ¡DESPEGAR!
              </button>
            </motion.div>
          )}

          {gameState === 'PLAYING' && currentProblem && (
            <motion.div 
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col justify-between py-8"
            >
              {/* Question */}
              <div className="text-center space-y-6">
                <p className="text-blue-400 font-black uppercase tracking-[0.4em] text-base">Resuelve la operación</p>
                <h2 className="text-[120px] font-black leading-none tracking-tighter text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] bg-black/10 py-8 rounded-[3rem] border border-white/5">
                  {currentProblem.question}
                </h2>
              </div>

              {/* Stars / Options */}
              <div className="grid grid-cols-3 gap-16 relative h-72">
                {currentProblem.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => checkAnswer(idx)}
                    disabled={isProcessing}
                    className="relative group flex flex-col items-center justify-center"
                  >
                    <motion.div
                      animate={{ 
                        scale: [1, 1.05, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ repeat: Infinity, duration: 6, delay: idx * 0.8 }}
                      className="relative flex items-center justify-center"
                    >
                      <div className={`w-48 h-48 flex items-center justify-center text-9xl transition-all duration-500 ${
                          idx === characterPos && isProcessing
                            ? 'scale-125 drop-shadow-[0_0_60px_rgba(255,255,255,0.9)]' 
                            : 'opacity-90 hover:opacity-100 hover:scale-110'
                        }`}>
                        {currentLevelConfig.objectEmoji}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-6xl font-black text-white drop-shadow-[0_6px_12px_rgba(0,0,0,0.9)] bg-black/30 px-6 py-2 rounded-2xl border border-white/10">
                          {option}
                        </span>
                      </div>
                    </motion.div>
                  </button>
                ))}
              </div>

              {/* Character Area */}
              <div className="relative h-56 w-full mt-auto">
                {level === 6 && (
                  <div className="absolute top-[-50px] left-0 w-full flex justify-between px-6 text-sm font-black uppercase text-white/60 tracking-widest">
                    <span>Salida</span>
                    <div className="flex-1 mx-6 border-b-4 border-dashed border-white/10" />
                    <span>Meta 🏁</span>
                  </div>
                )}
                <div className="absolute top-0 left-0 w-full h-4 bg-white/5 rounded-full overflow-hidden border border-white/10">
                  <motion.div 
                    className={`h-full shadow-[0_0_20px_rgba(59,130,246,0.8)] ${level === 6 ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-blue-600 to-blue-400'}`}
                    animate={{ width: `${(correctInLevel / SUCCESS_THRESHOLD) * 100}%` }}
                  />
                </div>
                
                <motion.div 
                  className="absolute bottom-0 text-[10rem] z-20"
                  animate={{ 
                    left: `${(characterPos * 33.33) + 16.66}%`,
                    x: '-50%',
                    y: isProcessing ? -180 : 0,
                    rotate: isProcessing ? [0, 360] : 0
                  }}
                  transition={{ 
                    left: { type: 'spring', stiffness: 100, damping: 15 },
                    y: { type: 'spring', stiffness: 250, damping: 12 },
                    rotate: { duration: 0.6 }
                  }}
                >
                  {MAIN_CHARACTER.emoji}
                </motion.div>
                
                {/* Controls Help */}
                <div className="absolute bottom-4 left-0 w-full flex justify-between px-16 opacity-20">
                  <ArrowLeft className="w-16 h-16" />
                  <ArrowRight className="w-16 h-16" />
                </div>
              </div>

              {/* Feedback Overlay */}
              <AnimatePresence>
                {feedback && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.5 }}
                    className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
                  >
                    <div className={`px-12 py-8 rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] text-white text-5xl font-black border-4 ${feedback.type === 'success' ? 'bg-green-500 border-green-400' : 'bg-red-500 border-red-400'}`}>
                      {feedback.message}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {gameState === 'LEVEL_UP' && (
            <motion.div 
              key="levelup"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-8"
            >
              <motion.div 
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-9xl"
              >
                {currentLevelConfig.icon}
              </motion.div>
              <div className="space-y-2">
                <h2 className="text-5xl font-black text-yellow-400 uppercase tracking-tighter">
                  {currentLevelConfig.successMessage}
                </h2>
                <p className="text-xl text-blue-200">¡Avanzando juntos como equipo!</p>
              </div>
              <button 
                onClick={nextLevel}
                className="group relative px-12 py-5 bg-green-600 text-white rounded-full text-2xl font-black hover:bg-green-500 transition-all shadow-[0_0_30px_rgba(34,197,94,0.5)] active:scale-95 flex items-center gap-3"
              >
                SIGUIENTE MISIÓN
                <ArrowRight className="w-8 h-8" />
              </button>
            </motion.div>
          )}

          {gameState === 'FINISHED' && (
            <motion.div 
              key="finished"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-10"
            >
              <div className="space-y-4">
                <div className="inline-block p-10 bg-yellow-400 rounded-full shadow-[0_0_50px_rgba(250,204,21,0.4)]">
                  <Flag className="w-24 h-24 text-white fill-white" />
                </div>
                <h2 className="text-6xl font-black uppercase tracking-tighter">
                  {LEVELS[5].successMessage}
                </h2>
                <p className="text-2xl text-blue-200">¡Dominaste todas las operaciones como un gran equipo!</p>
              </div>

              <div className="grid grid-cols-2 gap-8 w-full max-w-md">
                <div className="bg-white/10 p-6 rounded-3xl border border-white/20">
                  <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Puntaje Final</p>
                  <p className="text-5xl font-black text-blue-400">{score}</p>
                </div>
                <div className="bg-white/10 p-6 rounded-3xl border border-white/20">
                  <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Nivel Alcanzado</p>
                  <p className="text-5xl font-black text-yellow-400">{level}</p>
                </div>
              </div>

              <button 
                onClick={startGame}
                className="flex items-center gap-3 px-16 py-6 bg-white text-black rounded-full text-2xl font-black hover:bg-blue-400 hover:text-white transition-all active:scale-95"
              >
                <RefreshCw className="w-8 h-8" />
                NUEVA MISIÓN
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  </div>
);
}
