export type Character = {
  id: string;
  name: string;
  emoji: string;
  color: string;
};

export type Problem = {
  id: string;
  question: string;
  answer: number;
  options: number[];
  level: number;
};

export type GameState = 'START' | 'PLAYING' | 'LEVEL_UP' | 'FINISHED';

export type LevelConfig = {
  id: number;
  name: string;
  role: string;
  theme: string;
  icon: string;
  bgClass: string;
  objectEmoji: string;
  successMessage: string;
  description: string;
};
