import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/jwt';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const token = request.cookies.get('gbs-admin-token')?.value;
  if (!token || !verifyAdminToken(token)) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  try {
    const body = await request.json();

    const { data, error } = await supabase
      .from('campaigns')
      .update({
        title: body.title,
        description: body.description,
        probability: body.probability,
        display_order: body.display_order,
        active: body.active,
        start_date: body.start_date,
        end_date: body.end_date,
        banner_image_url: body.banner_image_url,
        terms_and_conditions: body.terms_and_conditions,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Kampanya güncellenemedi.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const token = request.cookies.get('gbs-admin-token')?.value;
  if (!token || !verifyAdminToken(token)) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  try {
    // Soft Delete
    const { error } = await supabase
      .from('campaigns')
      .update({
        is_deleted: true,
        active: false,
      })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Kampanya silinemedi.' },
      { status: 500 }
    );
  }
}