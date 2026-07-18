import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('gbs-admin-token')?.value;
  if (!token || !verifyAdminToken(token)) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.toLowerCase() || '';
  const campaignId = searchParams.get('campaign_id') || '';
  const prizeId = searchParams.get('prize_id') || '';

  try {
    let query = supabase
      .from('spins')
      .select(`
        id,
        is_delivered,
        delivery_note,
        created_at,
        users!inner(name, surname, phone),
        campaign_slug,
        campaigns(title),
        prizes(title)
      `)
      .order('created_at', { ascending: false });

    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }
    
    if (prizeId) {
      query = query.eq('prize_id', prizeId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Supabase JS client doesn't support complex inner join OR filtering smoothly without RPC
    // So we'll filter 'search' string manually here for users' name/phone if it exists
    let filteredData = data;
    if (search) {
      filteredData = data.filter((spin: any) => {
        const u = spin.users;
        const fullName = `${u.name} ${u.surname}`.toLowerCase();
        const phone = u.phone.toLowerCase();
        return fullName.includes(search) || phone.includes(search);
      });
    }

    return NextResponse.json(filteredData);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
