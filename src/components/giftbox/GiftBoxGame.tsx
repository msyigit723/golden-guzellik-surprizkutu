'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GiftBox } from './GiftBox';

interface GiftBoxGameProps {
  hasSpun: boolean;
}

export function GiftBoxGame({ hasSpun }: GiftBoxGameProps) {
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);
  const [isOpening, setIsOpening] = React.useState(false);
  const [prizeTitle, setPrizeTitle] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isDone, setIsDone] = React.useState(hasSpun);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSelectBox = async (index: number) => {
    if (isDone || isLoading || selectedIndex !== null) return;
    
    setSelectedIndex(index);
    setIsLoading(true);
    setError(null);

    try {
      // Call backend
      const res = await fetch('/api/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Sistem hatası.');
      }

      // Backend success! Start animation
      setIsOpening(true);
      
      // Wait for lid to open and light burst to finish before showing result text
      setTimeout(() => {
        setPrizeTitle(data.title);
        setIsDone(true);
        setIsLoading(false);
      }, 2500);

    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu.');
      // Reset if API fails
      setSelectedIndex(null);
      setIsOpening(false);
      setIsLoading(false);
    }
  };

  if (hasSpun && !prizeTitle) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-luxury-white w-full max-w-md mx-auto mt-20">
        <h2 className="text-2xl font-serif text-luxury-gold mb-4">Zaten Katıldınız</h2>
        <p className="text-gray-400">Her kampanya için yalnızca bir hediye seçme hakkınız bulunmaktadır.</p>
        <button onClick={() => window.location.href = '/sonuc'} className="mt-6 px-8 py-3 border border-luxury-gold text-luxury-gold rounded-full hover:bg-luxury-gold hover:text-luxury-black transition-colors font-medium">Sonucunuzu Görün</button>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[50vh] z-10 py-12">
      
      {error && (
        <div className="absolute top-0 w-full max-w-md bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-center backdrop-blur-md z-50">
          {error}
        </div>
      )}

      {/* Grid of 6 boxes */}
      <motion.div 
        layout
        className={`grid grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-16 md:gap-x-24 md:gap-y-20 transition-all duration-700 ease-in-out ${selectedIndex !== null ? 'scale-125 mt-10 md:mt-20' : 'mt-4'}`}
      >
        {[0, 1, 2, 3, 4, 5].map((idx) => {
           const isSelected = selectedIndex === idx;
           const isHidden = selectedIndex !== null && !isSelected;

           return (
             <div key={idx} className={isHidden ? 'absolute opacity-0 pointer-events-none transition-opacity duration-500' : 'relative z-10 flex justify-center'}>
               <GiftBox 
                 index={idx}
                 isSelected={isSelected}
                 isOpening={isOpening}
                 isHidden={isHidden}
                 onClick={() => handleSelectBox(idx)}
               />
             </div>
           );
        })}
      </motion.div>

      {/* Result Overlay */}
      <AnimatePresence>
        {isDone && prizeTitle && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-luxury-black/40 backdrop-blur-sm mt-[100%] md:mt-[60%]"
          >
            <div className="text-center p-8 bg-gradient-to-b from-[#1a1a1a] to-[#050505] border border-[#d4af37]/40 rounded-2xl shadow-[0_0_50px_rgba(212,175,55,0.2)] w-full max-w-md mx-4">
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4 text-[#d4af37]">TEBRİKLER</h2>
              <p className="text-gray-400 text-xs uppercase tracking-[0.2em] mb-2">Kazandığınız Hediye</p>
              <p className="text-2xl md:text-3xl text-white font-medium mb-8 drop-shadow-lg">{prizeTitle}</p>
              <p className="text-sm text-gray-500">Detaylı bilgi için sizinle iletişime geçeceğiz.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
