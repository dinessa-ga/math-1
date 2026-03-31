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
  const [level2Data, setLevel2Data] = useState<{ num: number; step: number } | null>(null);
  const [useTimer, setUseTimer] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const generateProblem = useCallback((currentLevel: number) => {
    let base = 100;
    let num = 0;
    let type: 'multiply' | 'divide' = Math.random() > 0.5 ? 'multiply' : 'divide';

    // Level 1: Exploradores - simple with 100
    if (currentLevel === 1) {
      base = 100;
      num = Math.floor(Math.random() * 9) + 1; // 1-9
      type = Math.random() > 0.5 ? 'multiply' : 'divide';
      if (type === 'divide') num *= 100;
    } 
    // Level 2: Constructores - decimal exercises with 10, 100, 1000 in sequence
    else if (currentLevel === 2) {
      type = 'divide';
      let nextNum = 0;
      let nextStep = 0;

      if (!level2Data || level2Data.step >= 3) {
        // Generate a new decimal number
        nextNum = parseFloat((Math.random() * 90 + 10).toFixed(1));
        nextStep = 1;
      } else {
        nextNum = level2Data.num;
        nextStep = level2Data.step + 1;
      }

      setLevel2Data({ num: nextNum, step: nextStep });
      num = nextNum;
      base = nextStep === 1 ? 10 : nextStep === 2 ? 100 : 1000;
    } 
    // Level 3: Escaladores - complex decimals
    else if (currentLevel === 3) {
      type = 'divide';
      const scenario = Math.floor(Math.random() * 3);
      if (scenario === 0) { // 125 ÷ 1000
        num = Math.floor(Math.random() * 900) + 100;
        base = 1000;
      } else if (scenario === 1) { // 9.84 ÷ 100
        num = parseFloat((Math.random() * 9 + 1).toFixed(2));
        base = 100;
      } else { // 0.75 ÷ 1000
        num = parseFloat((Math.random() * 0.9 + 0.1).toFixed(2));
        base = 1000;
      }
    }
    // Level 4: Navegantes - mixed decimals and large numbers
    else if (currentLevel === 4) {
      type = 'divide';
      const scenario = Math.floor(Math.random() * 3);
      if (scenario === 0) { // 3.456 ÷ 100
        num = parseFloat((Math.random() * 9 + 1).toFixed(3));
        base = 100;
      } else if (scenario === 1) { // 78.9 ÷ 1000
        num = parseFloat((Math.random() * 90 + 10).toFixed(1));
        base = 1000;
      } else { // 0.0045 ÷ 100
        num = parseFloat((Math.random() * 0.009 + 0.001).toFixed(4));
        base = 100;
      }
    }
    // Level 5: Constructores de ciudad - expert, fast, close distractors, NO timer
    else if (currentLevel === 5) {
      base = [10, 100, 1000][Math.floor(Math.random() * 3)];
      num = parseFloat((Math.random() * 999 + 1).toFixed(Math.floor(Math.random() * 2) + 1));
      type = Math.random() > 0.5 ? 'multiply' : 'divide';
    }
    // Level 6: Corredores - final race, integers and decimals, optional timer
    else {
      base = [10, 100, 1000][Math.floor(Math.random() * 3)];
      num = Math.random() > 0.5 
        ? Math.floor(Math.random() * 9000) + 100 
        : parseFloat((Math.random() * 999 + 1).toFixed(2));
      type = Math.random() > 0.5 ? 'multiply' : 'divide';
    }

    const answer = type === 'multiply' ? num * base : num / base;
    // Format answer to avoid floating point issues
    const formattedAnswer = parseFloat(answer.toFixed(6));
    const question = `${num.toString().replace('.', ',')} ${type === 'multiply' ? '×' : '÷'} ${base}`;

    const options = new Set<number>();
    options.add(formattedAnswer);
    
    // Closer distractors for higher levels
    while (options.size < 3) {
      let wrong;
      if (currentLevel >= 5) {
        // Very close distractors for Level 5 and 6
        const shift = [0.1, 10, 100, 0.01, 1000][Math.floor(Math.random() * 5)];
        wrong = parseFloat((formattedAnswer * shift).toFixed(6));
        if (Math.random() > 0.5) {
          const offset = [0.1, 0.01, 0.001, 0.0001][Math.floor(Math.random() * 4)];
          wrong = parseFloat((formattedAnswer + (Math.random() > 0.5 ? offset : -offset)).toFixed(6));
        }
      } else {
        const shift = [0.1, 10, 100, 0.01, 1000][Math.floor(Math.random() * 5)];
        wrong = parseFloat((formattedAnswer * shift).toFixed(6));
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
  }, [level2Data]);

  useEffect(() => {
    if (gameState === 'PLAYING' && level === 6 && useTimer) {
      if (!currentProblem) generateProblem(level);

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setGameState('FINISHED');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (gameState === 'PLAYING') {
      if (!currentProblem) generateProblem(level);
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, currentProblem, level, generateProblem, useTimer]);

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
    setLevel2Data(null);
    setGameState('PLAYING');
    generateProblem(level + 1);
  };

  const startGame = () => {
    setGameState('PLAYING');
    setLevel(1);
    setScore(0);
    setCorrectInLevel(0);
    setTimeLeft(60);
    setLevel2Data(null);
    generateProblem(1);
  };

  const selectLevel = (lvl: number) => {
    setLevel(lvl);
    setCorrectInLevel(0);
    setLevel2Data(null);
    setGameState('PLAYING');
    generateProblem(lvl);
  };

  const currentLevelConfig = LEVELS[level - 1];

  return (
    <div className={`min-h-screen bg-gradient-to-b ${currentLevelConfig?.bgClass || 'from-[#0B0E14] to-black'} text-white font-sans overflow-hidden relative transition-colors duration-1000 flex`}>
      
      {/* Level Selection Menu (Sidebar) */}
      <aside className="w-16 md:w-20 lg:w-24 bg-black/40 backdrop-blur-xl border-r border-white/10 flex flex-col items-center py-4 md:py-6 lg:py-8 gap-2 md:gap-3 lg:gap-4 z-30">
        <div className="mb-4 md:mb-6 text-blue-400">
          <MapPin className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10" />
        </div>
        <div className="flex flex-col gap-2 md:gap-3 lg:gap-4 items-center">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              onClick={() => selectLevel(l.id)}
              className={`w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-2xl lg:text-3xl transition-all duration-300 relative group ${
                level === l.id 
                  ? 'bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.6)] scale-110' 
                  : 'bg-white/5 hover:bg-white/10 grayscale hover:grayscale-0'
              }`}
            >
              {l.icon}
              
              {level === l.id && (
                <motion.div 
                  layoutId="activeLevel"
                  className="absolute -right-1 md:-right-2 w-1 md:w-2 h-8 md:h-10 bg-blue-400 rounded-full"
                />
              )}

              {/* Tooltip - Larger XL Text */}
              <div className="absolute left-full ml-4 md:ml-6 px-4 md:px-6 py-2 md:py-3 bg-white text-black text-sm md:text-lg lg:text-xl font-black uppercase tracking-tighter rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-all duration-200 transform translate-x-[-10px] group-hover:translate-x-0 shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-50">
                {l.name}
                {/* Arrow */}
                <div className="absolute top-1/2 -left-1 md:-left-2 -translate-y-1/2 w-2 md:w-4 h-2 md:h-4 bg-white rotate-45 rounded-sm" />
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

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 md:py-6 lg:py-8 h-screen flex flex-col relative z-10">
        
        {/* HUD */}
        {gameState === 'PLAYING' && (
          <div className="flex justify-between items-center bg-white/10 backdrop-blur-md p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-white/20 mb-4 md:mb-6 lg:mb-8 shadow-2xl">
            <div className="flex items-center gap-4 md:gap-6 lg:gap-8">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 md:gap-3">
                  <Rocket className="text-blue-400 w-4 h-4 md:w-5 md:h-5" />
                  <span className="font-black text-sm md:text-base lg:text-lg uppercase tracking-widest">Nivel {level}: {currentLevelConfig.name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-blue-200 font-medium uppercase tracking-wider mt-1">
                  <Users className="w-3 h-3 md:w-4 md:h-4" />
                  <span>Rol: {currentLevelConfig.role}</span>
                </div>
              </div>
              <div className="h-8 md:h-10 lg:h-12 w-px bg-white/20" />
              {level === 6 && (
                <div className="flex items-center gap-2 md:gap-4">
                  <button 
                    onClick={() => setUseTimer(!useTimer)}
                    className={`flex items-center gap-2 px-2 md:px-3 py-1 rounded-full transition-all ${useTimer ? 'bg-white/20 text-white' : 'bg-white/5 text-white/50'}`}
                    title={useTimer ? "Desactivar cronómetro" : "Activar cronómetro"}
                  >
                    <Timer className={`w-4 h-4 md:w-5 md:h-5 ${useTimer && timeLeft < 10 ? 'text-red-500 animate-pulse' : useTimer ? 'text-yellow-400' : ''}`} />
                    <span className="text-xs font-bold uppercase tracking-wider">{useTimer ? 'Cronómetro ON' : 'Cronómetro OFF'}</span>
                  </button>
                  {useTimer && (
                    <span className={`font-mono text-2xl md:text-3xl lg:text-4xl font-black min-w-[50px] md:min-w-[60px] ${timeLeft < 10 ? 'text-red-500' : ''}`}>{timeLeft}s</span>
                  )}
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">Puntaje</p>
              <p className="text-2xl md:text-3xl lg:text-4xl font-black text-blue-400 tabular-nums">{score}</p>
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
                  className="text-6xl md:text-8xl lg:text-[10rem] drop-shadow-[0_0_50px_rgba(59,130,246,0.5)]"
                >
                  {MAIN_CHARACTER.emoji}
                </motion.div>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter bg-gradient-to-b from-white to-blue-400 bg-clip-text text-transparent uppercase leading-tight">
                  Misión Matemática <br /> en Equipo
                </h1>
                <p className="text-lg md:text-xl lg:text-2xl text-blue-200 max-w-2xl mx-auto font-medium">
                  ¡Juntos llegamos a la meta! Resuelve operaciones con 10, 100 y 1000... ¡y también con decimales!
                </p>
              </div>

              <button 
                onClick={startGame}
                className="group relative px-12 md:px-16 lg:px-20 py-6 md:py-7 lg:py-8 bg-blue-600 text-white rounded-full text-2xl md:text-3xl lg:text-4xl font-black hover:bg-blue-500 transition-all shadow-[0_0_50px_rgba(37,99,235,0.6)] active:scale-95 hover:scale-105"
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
                <p className="text-blue-400 font-black uppercase tracking-[0.4em] text-sm md:text-base">Resuelve la operación</p>
                <h2 className="text-6xl md:text-8xl lg:text-[100px] xl:text-[120px] font-black leading-none tracking-tighter text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] bg-black/10 py-4 md:py-6 lg:py-8 rounded-[2rem] md:rounded-[3rem] border border-white/5">
                  {currentProblem.question}
                </h2>
              </div>

              {/* Stars / Options */}
              <div className="grid grid-cols-3 gap-8 md:gap-12 lg:gap-16 relative h-48 md:h-60 lg:h-72">
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
                      <div className={`w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 flex items-center justify-center text-5xl md:text-7xl lg:text-9xl transition-all duration-500 ${
                          idx === characterPos && isProcessing
                            ? 'scale-125 drop-shadow-[0_0_60px_rgba(255,255,255,0.9)]' 
                            : 'opacity-90 hover:opacity-100 hover:scale-110'
                        }`}>
                        {currentLevelConfig.objectEmoji}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-white drop-shadow-[0_6px_12px_rgba(0,0,0,0.9)] bg-black/30 px-3 md:px-4 lg:px-6 py-1 md:py-2 rounded-xl md:rounded-2xl border border-white/10">
                          {option}
                        </span>
                      </div>
                    </motion.div>
                  </button>
                ))}
              </div>

              {/* Character Area */}
              <div className="relative h-32 md:h-40 lg:h-48 xl:h-56 w-full mt-auto">
                {level === 6 && (
                  <div className="absolute top-[-30px] md:top-[-40px] lg:top-[-50px] left-0 w-full flex justify-between px-4 md:px-6 text-xs md:text-sm font-black uppercase text-white/60 tracking-widest">
                    <span>Salida</span>
                    <div className="flex-1 mx-4 md:mx-6 border-b-2 md:border-b-4 border-dashed border-white/10" />
                    <span>Meta 🏁</span>
                  </div>
                )}
                <div className="absolute top-0 left-0 w-full h-3 md:h-4 bg-white/5 rounded-full overflow-hidden border border-white/10">
                  <motion.div 
                    className={`h-full shadow-[0_0_20px_rgba(59,130,246,0.8)] ${level === 6 ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-blue-600 to-blue-400'}`}
                    animate={{ width: `${(correctInLevel / SUCCESS_THRESHOLD) * 100}%` }}
                  />
                </div>
                
                <motion.div 
                  className="absolute bottom-0 text-6xl md:text-8xl lg:text-[10rem] z-20"
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
                <div className="absolute bottom-2 md:bottom-4 left-0 w-full flex justify-between px-8 md:px-12 lg:px-16 opacity-20">
                  <ArrowLeft className="w-8 h-8 md:w-12 md:h-12 lg:w-16 lg:h-16" />
                  <ArrowRight className="w-8 h-8 md:w-12 md:h-12 lg:w-16 lg:h-16" />
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
                    <div className={`px-6 md:px-8 lg:px-12 py-4 md:py-6 lg:py-8 rounded-2xl md:rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] text-white text-3xl md:text-4xl lg:text-5xl font-black border-2 md:border-4 ${feedback.type === 'success' ? 'bg-green-500 border-green-400' : 'bg-red-500 border-red-400'}`}>
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
              className="flex-1 flex flex-col items-center justify-center text-center space-y-6 md:space-y-8"
            >
              <motion.div 
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-6xl md:text-8xl lg:text-9xl"
              >
                {currentLevelConfig.icon}
              </motion.div>
              <div className="space-y-2">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-yellow-400 uppercase tracking-tighter">
                  {currentLevelConfig.successMessage}
                </h2>
                <p className="text-lg md:text-xl text-blue-200">¡Avanzando juntos como equipo!</p>
              </div>
              <button 
                onClick={nextLevel}
                className="group relative px-8 md:px-10 lg:px-12 py-4 md:py-5 bg-green-600 text-white rounded-full text-xl md:text-2xl font-black hover:bg-green-500 transition-all shadow-[0_0_30px_rgba(34,197,94,0.5)] active:scale-95 flex items-center gap-2 md:gap-3"
              >
                SIGUIENTE MISIÓN
                <ArrowRight className="w-6 h-6 md:w-8 md:h-8" />
              </button>
            </motion.div>
          )}

          {gameState === 'FINISHED' && (
            <motion.div 
              key="finished"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-6 md:space-y-8 lg:space-y-10"
            >
              <div className="space-y-4">
                <div className="inline-block p-6 md:p-8 lg:p-10 bg-yellow-400 rounded-full shadow-[0_0_50px_rgba(250,204,21,0.4)]">
                  <Flag className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 text-white fill-white" />
                </div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter">
                  {LEVELS[5].successMessage}
                </h2>
                <p className="text-lg md:text-xl lg:text-2xl text-blue-200">¡Dominaste todas las operaciones como un gran equipo!</p>
              </div>

              <div className="grid grid-cols-2 gap-4 md:gap-6 lg:gap-8 w-full max-w-sm md:max-w-md">
                <div className="bg-white/10 p-4 md:p-5 lg:p-6 rounded-2xl md:rounded-3xl border border-white/20">
                  <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Puntaje Final</p>
                  <p className="text-3xl md:text-4xl lg:text-5xl font-black text-blue-400">{score}</p>
                </div>
                <div className="bg-white/10 p-4 md:p-5 lg:p-6 rounded-2xl md:rounded-3xl border border-white/20">
                  <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Nivel Alcanzado</p>
                  <p className="text-3xl md:text-4xl lg:text-5xl font-black text-yellow-400">{level}</p>
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
