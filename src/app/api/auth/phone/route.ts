import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { signUserToken } from '@/lib/jwt';
import { validatePhone, validateRequired } from '@/utils/validation';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!validateRequired(phone)) {
      return NextResponse.json({ error: 'Lütfen telefon numaranızı girin.' }, { status: 400 });
    }

    if (!validatePhone(phone)) {
      return NextResponse.json({ error: 'Geçersiz telefon numarası formatı. Örn: 05XXXXXXXXX' }, { status: 400 });
    }

    const cleanPhone = phone.trim();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('phone', cleanPhone)
      .single();

    let userId: string;

    if (existingUser) {
      // Existing user — authenticate directly
      userId = existingUser.id;
    } else {
      // New user — create with nullable fields
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([
          {
            phone: cleanPhone,
            name: null,
            surname: null,
            password_hash: null,
          },
        ])
        .select('id')
        .single();

      if (insertError) {
        console.error('Phone auth insert error:', insertError);
        return NextResponse.json({ error: 'Kayıt sırasında bir hata oluştu.' }, { status: 500 });
      }

      userId = newUser!.id;
    }

    // Generate JWT — identical to existing login flow
    const token = signUserToken(userId);

    // Create response
    const response = NextResponse.json({ success: true }, { status: 200 });

    // Set HTTP-only cookie — identical to existing login flow
    const maxAge = 7 * 24 * 60 * 60;
    const isHttps = request.url.startsWith('https://') || request.headers.get('x-forwarded-proto') === 'https';

    response.cookies.set('gbs-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' && isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: maxAge,
    });

    return response;
  } catch (error) {
    console.error('Phone Auth API Error:', error);
    return NextResponse.json({ error: 'Sunucu hatası oluştu.' }, { status: 500 });
  }
}
