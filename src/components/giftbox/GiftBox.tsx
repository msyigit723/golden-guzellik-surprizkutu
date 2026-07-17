'use client';

import * as React from 'react';
import { motion } from 'framer-motion';

interface GiftBoxProps {
  index: number;
  isSelected: boolean;
  gameState: 'IDLE' | 'SELECTING' | 'OPENING' | 'REVEALED' | 'ERROR';
  onSelect: () => void;
}

export function GiftBox({ index, isSelected, gameState, onSelect }: GiftBoxProps) {
  // If another box is selected, we are disabled and fading out
  const isOtherSelected = gameState !== 'IDLE' && !isSelected;
  
  // Prevent clicks if not in IDLE
  const isClickable = gameState === 'IDLE';

  // Base random delay for floating to make boxes float out of sync
  const floatDelay = index * 0.2;

  return (
    <motion.div
      className="relative flex flex-col items-center justify-center aspect-square w-full max-w-[200px] mx-auto cursor-pointer perspective-1000"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: isOtherSelected ? 0 : 1,
        scale: isOtherSelected ? 0.8 : isSelected ? 1.1 : 1,
        y: gameState === 'IDLE' ? [-4, 4, -4] : 0,
        zIndex: isSelected ? 20 : 1
      }}
      transition={{
        opacity: { duration: 0.4, delay: isOtherSelected ? 0.2 : 0 },
        scale: { duration: 0.5, type: 'spring' },
        y: { 
          duration: 3, 
          repeat: Infinity, 
          ease: "easeInOut",
          delay: floatDelay
        }
      }}
      whileHover={isClickable ? { scale: 1.05 } : {}}
      whileTap={isClickable ? { scale: 0.95 } : {}}
      onClick={() => isClickable && onSelect()}
      style={{ perspective: 1000 }}
    >
      {/* Background Glow when selected */}
      <motion.div 
        className="absolute inset-0 bg-luxury-gold/0 rounded-full blur-3xl pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: isSelected && (gameState === 'SELECTING' || gameState === 'OPENING') ? 0.4 : 0,
          scale: isSelected ? 1.5 : 1
        }}
        transition={{ delay: 0.4, duration: 1 }}
      />

      {/* Box Container (3D feel) */}
      <motion.div 
        className="relative w-full h-full flex items-center justify-center transform-style-3d"
        animate={
          isSelected && gameState === 'OPENING' 
            ? { x: [-2, 2, -2, 2, 0], transition: { duration: 0.4 } } 
            : {}
        }
      >
        {/* Box Body SVG */}
        <div className="absolute inset-0 w-full h-full z-10 flex items-end justify-center pb-[10%]">
          <svg viewBox="0 0 100 100" className="w-[85%] h-[85%] drop-shadow-2xl">
            {/* Box Base (Deep Black/Gray gradient) */}
            <defs>
              <linearGradient id={`box-grad-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2A2A2A" />
                <stop offset="50%" stopColor="#141414" />
                <stop offset="100%" stopColor="#050505" />
              </linearGradient>
              <linearGradient id={`ribbon-grad-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#B8860B" />
                <stop offset="50%" stopColor="#FFD700" />
                <stop offset="100%" stopColor="#B8860B" />
              </linearGradient>
            </defs>
            <path d="M10 30 L90 30 L85 95 L15 95 Z" fill={`url(#box-grad-${index})`} stroke="#333" strokeWidth="0.5"/>
            {/* Vertical Ribbon */}
            <rect x="42" y="30" width="16" height="65" fill={`url(#ribbon-grad-${index})`} />
          </svg>
        </div>

        {/* Golden Light Escaping (Behind Lid, inside box) */}
        {isSelected && (gameState === 'OPENING' || gameState === 'REVEALED') && (
          <motion.div 
            className="absolute top-1/4 w-[70%] h-[20px] bg-luxury-gold blur-xl z-15"
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: [0, 0.8, 1], scaleY: [0, 2, 4] }}
            transition={{ duration: 0.8 }}
          />
        )}

        {/* Box Lid SVG (Animates open) */}
        <motion.div 
          className="absolute inset-0 w-full h-full z-20 flex items-start justify-center pt-[5%] origin-[50%_35%]"
          initial={{ rotateX: 0 }}
          animate={{ rotateX: (isSelected && (gameState === 'OPENING' || gameState === 'REVEALED')) ? 110 : 0 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
        >
          <svg viewBox="0 0 100 100" className="w-[95%] h-[95%] drop-shadow-xl">
            {/* Lid Base */}
            <path d="M5 25 L95 25 L92 40 L8 40 Z" fill={`url(#box-grad-${index})`} stroke="#444" strokeWidth="0.5"/>
            {/* Horizontal Ribbon on Lid */}
            <rect x="5" y="30" width="90" height="6" fill={`url(#ribbon-grad-${index})`} />
            {/* Vertical Ribbon on Lid */}
            <rect x="42" y="25" width="16" height="15" fill={`url(#ribbon-grad-${index})`} />
            
            {/* Ribbon Bow */}
            <path d="M42 25 Q30 10 40 20 Q50 30 42 25 Z" fill={`url(#ribbon-grad-${index})`} />
            <path d="M58 25 Q70 10 60 20 Q50 30 58 25 Z" fill={`url(#ribbon-grad-${index})`} />
          </svg>
        </motion.div>

        {/* Magic Particles (Appear during opening) */}
        {isSelected && (gameState === 'OPENING' || gameState === 'REVEALED') && (
          <motion.div className="absolute inset-0 z-30 pointer-events-none">
             {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-luxury-gold rounded-full blur-[1px]"
                  style={{ top: '30%', left: '50%' }}
                  initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0], 
                    x: (Math.random() - 0.5) * 150, 
                    y: -50 - Math.random() * 100,
                    scale: [0, 1.5, 0]
                  }}
                  transition={{ duration: 1.5, delay: Math.random() * 0.4, ease: "easeOut" }}
                />
             ))}
          </motion.div>
        )}
      </motion.div>

    </motion.div>
  );
}
