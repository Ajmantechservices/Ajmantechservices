import { createClient } from '@supabase/supabase-js';

const DEFAULT_ADMIN_EMAIL = 'joshuaajayi0148@gmail.com';
const DEFAULT_ADMIN_PASSWORD = 'Ayomide0148';

export async function POST(req?: Request) {
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      return Response.json(
        { error: 'Missing SUPABASE_SERVICE_ROLE_KEY environment variable' },
        { status: 500 }
      );
    }

    const supabaseUrl =
      process.env.VITE_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      'https://ynrmthgxykbvuvtwhvlq.supabase.co';

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const email = DEFAULT_ADMIN_EMAIL;
    const password = DEFAULT_ADMIN_PASSWORD;

    // a) Search or create user joshuaajayi0148@gmail.com with password Ayomide0148 and email_confirm: true
    let userId: string;

    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      throw listError;
    }

    const existingUser = usersData?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        {
          password,
          email_confirm: true,
          user_metadata: {
            ...existingUser.user_metadata,
            full_name: 'Joshua Ajayi',
            role: 'admin',
          },
        }
      );
      if (updateError) {
        throw updateError;
      }
      userId = updateData.user.id;
    } else {
      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: 'Joshua Ajayi',
          role: 'admin',
        },
      });

      if (createError) {
        // If user already exists due to concurrent creation
        if (createError.message?.toLowerCase().includes('already')) {
          const { data: retryList } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
          const retryUser = retryList?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
          if (retryUser) {
            const { error: retryUpdateErr } = await supabaseAdmin.auth.admin.updateUserById(retryUser.id, {
              password,
              email_confirm: true,
              user_metadata: {
                ...retryUser.user_metadata,
                full_name: 'Joshua Ajayi',
                role: 'admin',
              },
            });
            if (retryUpdateErr) throw retryUpdateErr;
            userId = retryUser.id;
          } else {
            throw createError;
          }
        } else {
          throw createError;
        }
      } else if (createData?.user) {
        userId = createData.user.id;
      } else {
        throw new Error('Supabase admin API did not return created user data');
      }
    }

    // b) Upsert into public.profiles setting role: 'admin'
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert(
      {
        id: userId,
        email,
        full_name: 'Joshua Ajayi',
        role: 'admin',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (profileError) {
      console.warn('Profile upsert warning:', profileError);
    }

    return Response.json(
      { success: true, message: 'Admin account seeded successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    return Response.json(
      { error: error?.message || 'Failed to seed admin user' },
      { status: 500 }
    );
  }
}

export async function GET(req?: Request) {
  return POST(req);
}
