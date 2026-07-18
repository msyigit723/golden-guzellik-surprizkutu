'use client';

import * as React from 'react';
import { motion } from 'framer-motion';

interface GiftBoxProps {
  index: number;
  isSelected: boolean;
  isOpening: boolean;
  isHidden: boolean;
  onClick: () => void;
}

export function GiftBox({ index, isSelected, isOpening, isHidden, onClick }: GiftBoxProps) {
  return (
    <motion.div
      layout
      layoutId={`giftbox-${index}`}
      onClick={!isSelected && !isHidden ? onClick : undefined}
      className={`relative select-none perspective-[1000px] w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 ${isHidden ? 'pointer-events-none' : 'cursor-pointer'}`}
      initial={{ opacity: 0, y: 50 }}
      animate={{
        opacity: isHidden ? 0 : 1,
        scale: isHidden ? 0.8 : (isSelected ? 1.3 : 1),
        y: isSelected ? -40 : [0, -8, 0], // floating animation
        zIndex: isSelected ? 50 : 10,
      }}
      transition={
        isSelected 
        ? { duration: 0.6, ease: "easeInOut" }
        : isHidden 
        ? { duration: 0.4 } 
        : {
            y: {
              duration: 2.5,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
              delay: index * 0.2, // stagger floating
            },
            opacity: { duration: 0.5 }
          }
      }
      whileHover={!isSelected && !isHidden ? { scale: 1.05, filter: 'drop-shadow(0px 0px 15px rgba(212, 175, 55, 0.4))' } : {}}
      whileTap={!isSelected && !isHidden ? { scale: 0.95 } : {}}
    >
      {/* 3D Box Rendering */}
      <motion.div
        className="w-full h-full relative"
        animate={isOpening && isSelected ? {
          rotateZ: [-0, -5, 5, -5, 5, 0],
          transition: { duration: 0.5, ease: "easeInOut" }
        } : {}}
      >
        {/* Box Body */}
        <div className="absolute inset-x-0 bottom-0 h-[75%] bg-gradient-to-br from-[#2a2a2a] to-[#111111] rounded-b-xl border border-[#d4af37]/30 shadow-2xl flex items-center justify-center overflow-hidden">
          {/* Gold Ribbon Vertical */}
          <div className="absolute inset-y-0 w-[18%] bg-gradient-to-r from-[#b38b22] via-[#f1d06e] to-[#b38b22] shadow-inner" />
        </div>

        {/* Box Lid */}
        <motion.div
          className="absolute inset-x-[-8%] top-[5%] h-[30%] bg-gradient-to-br from-[#333333] to-[#1a1a1a] rounded-sm border border-[#d4af37]/50 shadow-[0_10px_20px_rgba(0,0,0,0.5)] flex items-center justify-center origin-bottom z-20"
          animate={isOpening && isSelected ? {
            rotateX: 105,
            y: -60,
            opacity: 0,
            transition: { delay: 0.6, duration: 1.2, ease: 'easeOut' }
          } : {}}
        >
          {/* Gold Ribbon Vertical on Lid */}
          <div className="absolute inset-y-0 w-[16%] bg-gradient-to-r from-[#b38b22] via-[#f1d06e] to-[#b38b22] shadow-inner" />
          {/* Gold Ribbon Horizontal on Lid */}
          <div className="absolute inset-x-0 h-[35%] bg-gradient-to-b from-[#b38b22] via-[#f1d06e] to-[#b38b22] shadow-inner" />
          
          {/* Bow */}
          <div className="absolute -top-7 w-12 h-10 flex justify-center">
             <div className="absolute left-1 w-6 h-8 border-4 border-[#d4af37] rounded-full rotate-[-45deg] origin-bottom-right" />
             <div className="absolute right-1 w-6 h-8 border-4 border-[#d4af37] rounded-full rotate-[45deg] origin-bottom-left" />
             <div className="absolute top-4 w-4 h-4 bg-gradient-to-br from-[#f1d06e] to-[#b38b22] rounded-full shadow-md z-10" />
          </div>
        </motion.div>

        {/* Light Burst & Particles when opening */}
        {isOpening && isSelected && (
          <motion.div
            className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 flex items-center justify-center z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.8, delay: 0.7, ease: "easeOut" }}
          >
             <div className="absolute w-[200px] h-[500px] bg-gradient-to-t from-[#d4af37]/0 via-[#d4af37]/80 to-[#d4af37]/0 blur-2xl origin-bottom" style={{ boxShadow: '0 0 50px 20px rgba(212, 175, 55, 0.5)' }} />
             
             {/* Particles */}
             {[...Array(15)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-white rounded-full shadow-[0_0_10px_2px_#fff]"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0], 
                    x: (Math.random() - 0.5) * 400, 
                    y: -100 - Math.random() * 300,
                    scale: [0, Math.random() * 1.5 + 0.5, 0]
                  }}
                  transition={{ duration: 1.5 + Math.random(), delay: 0.7 + Math.random() * 0.2, ease: "easeOut" }}
                />
             ))}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
