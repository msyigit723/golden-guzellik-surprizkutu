import * as React from 'react';
import { GiftBoxGame } from '@/components/giftbox/GiftBoxGame';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { verifyUserToken } from '@/lib/jwt';

export default async function GiftBoxPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('gbs-token')?.value;
  
  let hasSpun = false;
  let userId = null;

  if (token) {
    const payload = verifyUserToken(token);
    if (payload) {
      userId = payload.userId;
      
      const { data: existingSpin } = await supabase
        .from('spins')
        .select('id')
        .eq('user_id', userId)
        .single();
        
      if (existingSpin) {
        hasSpun = true;
      }
    }
  }

  const now = new Date().toISOString();

  // Fetch active campaign enforcing temporal expiration
  const { data: activeCampaign } = await supabase
    .from('campaigns')
    .select('id, title, description, banner_image_url, terms_and_conditions')
    .eq('active', true)
    .eq('is_deleted', false)
    .or(`end_date.is.null,end_date.gt.${now}`)
    .limit(1)
    .single();

  // We still fetch prizes to check if campaign is fully active and not out of stock
  let isActive = false;

  if (activeCampaign) {
    const { data: prizes } = await supabase
      .from('prizes')
      .select('id')
      .eq('campaign_id', activeCampaign.id)
      .eq('is_active', true)
      .eq('is_deleted', false)
      .limit(1);

    if (prizes && prizes.length > 0) {
      isActive = true;
    }
  }

  return (
    <div className="relative z-10 container mx-auto px-4 py-8 flex flex-col items-center min-h-[100dvh]">
        
        {/* Header / Campaign Info */}
        <div className="text-center mb-8 mt-4 max-w-lg">
          {activeCampaign?.banner_image_url && (
            <img 
              src={activeCampaign.banner_image_url} 
              alt="Campaign Banner" 
              className="w-full h-32 object-cover rounded-2xl shadow-premium mb-6"
            />
          )}
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-luxury-gold mb-3">
            {activeCampaign?.title || 'Golden Beauty Hediye Kutusu'}
          </h1>
          <p className="text-luxury-text-muted text-sm md:text-base font-medium">
            {activeCampaign?.description || 'Hediye kutunuzu seçin ve size özel ödülü keşfedin!'}
          </p>
        </div>
      
      {/* Game Area */}
      <div className="flex-1 w-full flex flex-col items-center justify-center min-h-[400px]">
        {isActive ? (
          <GiftBoxGame hasSpun={hasSpun} />
        ) : (
          <div className="text-center p-8 bg-luxury-surface border border-white/10 rounded-xl max-w-sm w-full shadow-premium">
            <h3 className="font-serif text-xl font-bold text-luxury-gold mb-2">Çok Yakında!</h3>
            <p className="text-luxury-text-muted text-sm">Şu anda aktif bir hediye kampanyası bulunmamaktadır. Lütfen daha sonra tekrar deneyin.</p>
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div className="mt-8 text-center text-xs text-luxury-text-muted max-w-xs px-4">
        <p>Sadece 1 adet hediye kutusu seçme hakkınız bulunmaktadır. Kazandığınız ödül hesabınıza kaydedilecektir.</p>
      </div>

      {/* Terms and Conditions (Optional) */}
      {activeCampaign?.terms_and_conditions && (
        <div className="mt-8 max-w-md w-full bg-luxury-surface/50 backdrop-blur-sm p-4 rounded-xl text-sm text-luxury-text-muted text-center border border-white/10 shadow-premium">
          <h3 className="font-bold mb-2 text-luxury-gold">Şartlar ve Koşullar</h3>
          <p className="whitespace-pre-line text-xs">{activeCampaign.terms_and_conditions}</p>
        </div>
      )}
      
    </div>
  );
}
