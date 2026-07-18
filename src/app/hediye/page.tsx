import * as React from 'react';
import { GiftBoxGame } from '@/components/giftbox/GiftBoxGame';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { verifyUserToken } from '@/lib/jwt';

export default async function GiftBoxPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('gbs-token')?.value;
  
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

  let hasSpun = false;
  let userId = null;

  if (token && activeCampaign) {
    const payload = verifyUserToken(token);
    if (payload) {
      userId = payload.userId;
      
      const { data: existingSpin } = await supabase
        .from('spins')
        .select('id')
        .eq('user_id', userId)
        .eq('campaign_id', activeCampaign.id)
        .single();
        
      if (existingSpin) {
        hasSpun = true;
      }
    }
  }

  return (
    <div className="relative z-10 container mx-auto px-4 py-8 flex flex-col items-center min-h-[100dvh]">
        
        {/* Header / Campaign Info */}
        <div className="text-center mb-4 mt-2 max-w-lg">
          {activeCampaign?.banner_image_url && (
            <img 
              src={activeCampaign.banner_image_url} 
              alt="Campaign Banner" 
              className="w-full h-32 object-cover rounded-2xl shadow-premium mb-6 border border-[#d4af37]/20"
            />
          )}
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-luxury-gold mb-3 drop-shadow-md">
            {activeCampaign?.title || 'Golden Güzellik Sürpriz Kutu'}
          </h1>
          <p className="text-gray-300 text-sm md:text-base font-medium">
            {activeCampaign?.description || 'Aşağıdaki kutulardan birini seçerek sürpriz hediyenizi kazanın!'}
          </p>
        </div>
      
      {/* Game Area */}
      <div className="flex-1 w-full flex flex-col items-center justify-center">
        {activeCampaign ? (
          <GiftBoxGame hasSpun={hasSpun} />
        ) : (
          <div className="text-center p-8 bg-[#111] border border-[#d4af37]/30 rounded-xl max-w-sm w-full mt-10">
            <h3 className="font-serif text-xl font-bold mb-2 text-luxury-gold">Çok Yakında!</h3>
            <p className="text-gray-400 text-sm">Şu anda aktif bir ödül kampanyası bulunmamaktadır. Lütfen daha sonra tekrar deneyin.</p>
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div className="mt-12 text-center text-xs text-gray-500 max-w-xs px-4">
        <p>Sadece 1 kez hediye seçme hakkınız bulunmaktadır. Kazandığınız ödüller hesabınıza kaydedilecektir.</p>
      </div>

      {/* Terms and Conditions (Optional) */}
      {activeCampaign?.terms_and_conditions && (
        <div className="mt-8 max-w-md w-full bg-[#111]/80 backdrop-blur-sm p-4 rounded-xl text-sm text-gray-400 text-center border border-[#d4af37]/20 shadow-sm">
          <h3 className="font-bold mb-2 text-luxury-gold">Şartlar ve Koşullar</h3>
          <p className="whitespace-pre-line text-xs">{activeCampaign.terms_and_conditions}</p>
        </div>
      )}
      
    </div>
  );
}
