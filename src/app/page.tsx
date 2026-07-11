'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LandingPage() {
  const [phone, setPhone] = React.useState('');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    const value = e.target.value.replace(/\D/g, '').slice(0, 11);
    setPhone(value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // The button does NOT need to work yet.
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
      {/* Gift icon */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-luxury-gold/10">
        <span className="text-4xl" role="img" aria-label="gift">🎁</span>
      </div>

      <h1 className="mb-3 font-serif text-3xl font-bold tracking-tight text-luxury-black sm:text-4xl">
        Golden Güzellik Çarkı
      </h1>

      <p className="mb-2 max-w-sm text-base text-gray-600">
        Telefon numaranızı girerek kampanyaya katılabilirsiniz.
      </p>
      <p className="mb-8 max-w-sm text-sm text-gray-500">
        Her telefon numarası yalnızca 1 kez çark çevirebilir.
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <Input
          name="phone"
          type="tel"
          inputMode="numeric"
          placeholder="05XX XXX XX XX"
          value={phone}
          onChange={handlePhoneChange}
          autoComplete="tel"
        />

        <Button
          type="submit"
          size="lg"
          className="w-full"
        >
          ÇARKI ÇEVİRMEYE BAŞLA
        </Button>
      </form>
    </div>
  );
}
