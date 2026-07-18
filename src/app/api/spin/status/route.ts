import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyUserToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    const { data: activeCampaign } = await supabase
      .from('campaigns')
      .select('id')
      .eq('active', true)
      .eq('is_deleted', false)
      .or(`end_date.is.null,end_date.gt.${now}`)
      .limit(1)
      .single();

    if (!activeCampaign) {
      return NextResponse.json({ hasSpun: false }, { status: 200 });
    }

    const { data: existingSpin, error } = await supabase
      .from('spins')
      .select('prize_id, prizes(title)')
      .eq('user_id', userId)
      .eq('campaign_id', activeCampaign.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
      console.error('Spin status DB error:', error);
      return NextResponse.json({ error: 'Veritabanı hatası.' }, { status: 500 });
    }

    if (existingSpin) {
      return NextResponse.json({ 
        hasSpun: true, 
        prize_id: existingSpin.prize_id,
        title: (existingSpin.prizes as any)?.title
      }, { status: 200 });
    }

    return NextResponse.json({ hasSpun: false }, { status: 200 });

  } catch (error) {
    console.error('Spin status error:', error);
    return NextResponse.json({ error: 'Sunucu hatası oluştu.' }, { status: 500 });
  }
}
