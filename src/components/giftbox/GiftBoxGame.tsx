'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GiftBox } from './GiftBox';

export interface CampaignSegment {
  id: string;
  title: string;
  color?: string;
  textColor?: string;
  icon?: string;
  imageUrl?: string;
}

interface GiftBoxGameProps {
  hasSpun: boolean;
}

type GameState = 'IDLE' | 'SELECTING' | 'OPENING' | 'REVEALED' | 'ERROR';

export function GiftBoxGame({ hasSpun: initialHasSpun }: GiftBoxGameProps) {
  const [hasSpun, setHasSpun] = React.useState(initialHasSpun);
  const [gameState, setGameState] = React.useState<GameState>('IDLE');
  const [selectedBoxIndex, setSelectedBoxIndex] = React.useState<number | null>(null);
  const [prize, setPrize] = React.useState<{ id: string; title: string } | null>(null);
  const [errorMsg, setErrorMsg] = React.useState('');

  const boxes = [0, 1, 2, 3, 4, 5];

  const handleBoxSelect = async (index: number) => {
    if (gameState !== 'IDLE' || hasSpun) return;

    setSelectedBoxIndex(index);
    setGameState('SELECTING');

    try {
      // Call the backend API
      const response = await fetch('/api/spin', {
        method: 'POST',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Sistem hatası oluştu.');
      }

      setPrize({ id: data.prize_id, title: data.title });

      // Ensure minimum 1200ms for loading animation as per requirement
      setTimeout(() => {
        setGameState('OPENING');
        
        setTimeout(() => {
          setGameState('REVEALED');
          setHasSpun(true);
        }, 600); // 1200 + 600 = 1800ms total
        
      }, 1200);

    } catch (err: any) {
      setErrorMsg(err.message);
      setGameState('ERROR');
    }
  };

  if (hasSpun && gameState === 'IDLE') {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-luxury-surface/50 backdrop-blur-md rounded-2xl border border-white/10 shadow-premium max-w-md w-full text-center">
        <h3 className="font-serif text-2xl font-bold text-luxury-gold mb-3">Zaten Katıldınız</h3>
        <p className="text-luxury-text-muted">Bu kampanya için hediye hakkınızı daha önce kullandınız.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[500px]">
      
      {/* ERROR STATE */}
      <AnimatePresence>
        {gameState === 'ERROR' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute z-50 p-6 bg-red-900/90 border border-red-500 rounded-xl text-center backdrop-blur-md shadow-premium"
          >
            <h3 className="text-xl font-bold text-white mb-2">Hata</h3>
            <p className="text-white/80 mb-4">{errorMsg}</p>
            <button 
              onClick={() => { setGameState('IDLE'); setSelectedBoxIndex(null); }}
              className="px-6 py-2 bg-white text-red-900 rounded-lg font-medium"
            >
              Tekrar Dene
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REVEALED CONGRATULATIONS OVERLAY */}
      <AnimatePresence>
        {gameState === 'REVEALED' && prize && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute z-40 w-full max-w-lg p-10 bg-luxury-surface/90 backdrop-blur-xl rounded-3xl border border-luxury-gold/30 shadow-[0_0_80px_rgba(212,175,55,0.2)] text-center"
          >
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="font-serif text-4xl font-bold text-luxury-gold mb-2"
            >
              Tebrikler!
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-xs tracking-[0.2em] text-luxury-text-muted mb-6 uppercase"
            >
              KAZANDIĞINIZ HEDİYE
            </motion.p>
            
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1, type: "spring" }}
              className="py-6 px-4 bg-black/40 rounded-2xl border border-luxury-gold/20 mb-8"
            >
              <h3 className="text-2xl md:text-3xl font-bold text-luxury-white">
                {prize.title}
              </h3>
            </motion.div>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="text-sm text-luxury-text-muted/80"
            >
              Detaylı bilgi için sizinle iletişime geçeceğiz.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GIFT BOXES GRID */}
      <div className={`grid grid-cols-3 gap-4 md:gap-8 lg:gap-12 w-full px-4 transition-opacity duration-1000 ${gameState === 'REVEALED' ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
        {boxes.map((boxIndex) => (
          <GiftBox 
            key={boxIndex}
            index={boxIndex}
            gameState={gameState}
            isSelected={selectedBoxIndex === boxIndex}
            onSelect={() => handleBoxSelect(boxIndex)}
          />
        ))}
      </div>

    </div>
  );
}
