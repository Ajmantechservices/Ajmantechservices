import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const serviceKey =
      body.serviceRoleKey ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      'https://ynrmthgxykbvuvtwhvlq.supabase.co';

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase URL or Service Role Key' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const targetEmail = 'joshuaajayi0148@gmail.com';
    const targetPassword = 'Ayomide0148';

    // 1. Create or update user in auth.users
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.warn('listUsers notice:', listError.message);
    }
    const existingUser = usersData?.users?.find((u) => u.email?.toLowerCase() === targetEmail.toLowerCase());

    let userId = existingUser?.id;

    if (existingUser) {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        password: targetPassword,
        email_confirm: true,
      });
      if (updateError) throw updateError;
    } else {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: targetEmail,
        password: targetPassword,
        email_confirm: true,
      });
      if (createError) throw createError;
      if (!newUser?.user) throw new Error('Failed to create user in auth.users');
      userId = newUser.user.id;
    }

    // 2. Upsert profile with admin role
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({ id: userId, email: targetEmail, role: 'admin' }, { onConflict: 'id' });

    if (profileError) throw profileError;

    return NextResponse.json({ success: true, message: 'Admin account seeded successfully!' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error occurred' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return POST(req);
}
