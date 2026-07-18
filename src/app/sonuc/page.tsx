import * as React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { cookies } from 'next/headers';
import { verifyUserToken } from '@/lib/jwt';
import { supabase } from '@/lib/supabase';

export default async function ResultPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('gbs-token')?.value;
  
  let prizeTitle = '';

  if (token) {
    const payload = verifyUserToken(token);
    if (payload) {
      try {
        const now = new Date().toISOString();
        const { data: activeCampaign } = await supabase
          .from('campaigns')
          .select('id')
          .eq('active', true)
          .eq('is_deleted', false)
          .or(`end_date.is.null,end_date.gt.${now}`)
          .limit(1)
          .single();

        if (activeCampaign) {
          const { data: existingSpin, error } = await supabase
            .from('spin_sonuçları')
            .select('prize_title_snapshot')
            .eq('user_id', payload.userId)
            .eq('campaign_id', activeCampaign.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
            
          if (existingSpin && !error) {
            prizeTitle = existingSpin.prize_title_snapshot || '';
          }
        }
      } catch (err) {
        console.error('Error fetching spin result:', err);
      }
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-md border-luxury-gold/30 bg-luxury-black text-luxury-white">
        <CardContent className="flex flex-col items-center p-8 text-center space-y-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-luxury-gold text-luxury-black">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h1 className="font-serif text-3xl font-bold mb-2">Tebrikler!</h1>
            <p className="text-luxury-white/80 text-lg">
              {prizeTitle ? `${prizeTitle} Kazandınız!` : 'Ödülünüzü Kazandınız!'}
            </p>
          </div>
          <p className="text-sm text-luxury-white/60">
            Detaylı bilgi için sizinle iletişime geçeceğiz.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
