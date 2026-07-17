'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { validatePhone, validateRequired } from '@/utils/validation';

export default function LandingPage() {
  const [phone, setPhone] = React.useState('');
  const [error, setError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    const value = e.target.value.replace(/\D/g, '').slice(0, 11);
    setPhone(value);
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!validateRequired(phone)) {
      setError('Lütfen telefon numaranızı girin.');
      return;
    }

    if (!validatePhone(phone)) {
      setError('Geçersiz telefon formatı. Örn: 05XXXXXXXXX');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Bir hata oluştu.');
      }

      // Redirect to hediye page
      window.location.href = '/hediye';
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
      {/* Gift icon */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-luxury-gold/10">
        <span className="text-4xl" role="img" aria-label="gift">🎁</span>
      </div>

      <h1 className="mb-3 font-serif text-3xl font-bold tracking-tight text-luxury-gold sm:text-4xl">
        Golden Beauty Hediye Kutusu
      </h1>

      <p className="mb-2 max-w-sm text-base text-luxury-text-muted">
        Telefon numaranızı girerek kampanyaya katılabilirsiniz.
      </p>
      <p className="mb-8 max-w-sm text-sm text-luxury-text-muted/70">
        Her telefon numarası yalnızca 1 hediye seçebilir.
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <Input
          name="phone"
          type="tel"
          inputMode="numeric"
          placeholder="05XX XXX XX XX"
          value={phone}
          onChange={handlePhoneChange}
          error={error}
          disabled={isLoading}
          autoComplete="tel"
        />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={isLoading}
        >
          HEDİYENİ SEÇ
        </Button>
      </form>
    </div>
  );
}
