import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyUserToken } from '@/lib/jwt';

function getWeightedRandomPrize(prizes: any[]) {
  const totalWeight = prizes.reduce((sum, p) => sum + Number(p.probability), 0);
  let random = Math.random() * totalWeight;
  for (const prize of prizes) {
    if (random < Number(prize.probability)) return prize;
    random -= Number(prize.probability);
  }
  return prizes[prizes.length - 1];
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('gbs-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const payload = verifyUserToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Geçersiz veya süresi dolmuş oturum.' }, { status: 401 });
    }

    const userId = payload.userId;

    const now = new Date().toISOString();
    
    // Fetch active campaigns (automatically resolves from DB without hardcoding)
    const { data: activeCampaign } = await supabase
      .from('campaigns')
      .select('id, slug')
      .eq('active', true)
      .eq('is_deleted', false)
      .or(`end_date.is.null,end_date.gt.${now}`)
      .limit(1)
      .single();

    if (!activeCampaign) {
      return NextResponse.json({ error: 'Aktif kampanya bulunmamaktadır.' }, { status: 400 });
    }

    // Check if user already spun in THIS ACTIVE CAMPAIGN
    const { data: existingSpin } = await supabase
      .from('spins')
      .select('prize_id, prizes(title)')
      .eq('user_id', userId)
      .eq('campaign_id', activeCampaign.id)
      .single();

    if (existingSpin) {
      return NextResponse.json({ 
        error: 'Zaten bu kampanya için çevirme hakkınızı kullandınız.',
        prize_id: existingSpin.prize_id,
        title: (existingSpin.prizes as any)?.title
      }, { status: 403 });
    }

    // Fetch active prizes with stock > 0 for this campaign
    const { data: activePrizes } = await supabase
      .from('prizes')
      .select('*')
      .eq('campaign_id', activeCampaign.id)
      .eq('is_active', true)
      .eq('is_deleted', false)
      .gt('stock', 0);

    if (!activePrizes || activePrizes.length === 0) {
      return NextResponse.json({ error: 'Ödül stoğu tükenmiştir.' }, { status: 400 });
    }

    // Retry loop for high-concurrency race conditions (stock running out mid-spin)
    let attempts = 0;
    const MAX_ATTEMPTS = 3;
    let availablePrizes = [...activePrizes];

    while (attempts < MAX_ATTEMPTS && availablePrizes.length > 0) {
      attempts++;
      const selectedPrize = getWeightedRandomPrize(availablePrizes);

      // Call the atomic RPC to claim the prize
      const { data: rpcResult, error: rpcError } = await supabase.rpc('claim_prize', {
        p_user_id: userId,
        p_campaign_id: activeCampaign.id,
        p_campaign_slug: activeCampaign.slug || 'surpriz_kutu',
        p_prize_id: selectedPrize.id
      });

      if (rpcError) {
        console.error('RPC Error:', rpcError);
        return NextResponse.json({ error: 'Sistem hatası oluştu.' }, { status: 500 });
      }

      if (rpcResult.success) {
        return NextResponse.json({ 
          success: true, 
          prize_id: selectedPrize.id,
          title: selectedPrize.title
        });
      }

      // If out of stock, remove it from available prizes and retry
      if (rpcResult.error === 'out_of_stock') {
        availablePrizes = availablePrizes.filter(p => p.id !== selectedPrize.id);
        continue;
      }

      // If already spun
      if (rpcResult.error === 'already_spun') {
        return NextResponse.json({ error: 'Zaten çevirme hakkınızı kullandınız.' }, { status: 403 });
      }
    }

    return NextResponse.json({ error: 'Şu anda yoğunluk var, lütfen tekrar deneyin.' }, { status: 500 });

  } catch (error) {
    console.error('Spin execution error:', error);
    return NextResponse.json({ error: 'Sunucu hatası oluştu.' }, { status: 500 });
  }
}
