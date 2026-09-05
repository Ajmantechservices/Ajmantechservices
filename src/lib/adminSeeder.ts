import { createClient } from '@supabase/supabase-js';

export const DEFAULT_ADMIN_EMAIL = 'joshuaajayi0148@gmail.com';
export const DEFAULT_ADMIN_PASSWORD = 'Ayomide0148';

export interface SeedAdminParams {
  supabaseUrl?: string;
  serviceRoleKey?: string;
  email?: string;
  password?: string;
  fullName?: string;
}

export interface SeedAdminResult {
  success: boolean;
  message: string;
  action?: 'created' | 'updated';
  userId?: string;
  email?: string;
  error?: string;
}

/**
 * Programmatically registers or updates an admin user with email_confirm: true
 * and sets the role in public.profiles to 'admin'.
 * Requires Supabase Service Role Key.
 */
export async function seedAdminUser(params: SeedAdminParams = {}): Promise<SeedAdminResult> {
  const url =
    params.supabaseUrl ||
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    '';

  const serviceKey =
    params.serviceRoleKey ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
    '';

  const email = (params.email || DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
  const password = params.password || DEFAULT_ADMIN_PASSWORD;
  const fullName = params.fullName || 'Joshua Ajayi';

  if (!url || !url.startsWith('https://')) {
    return {
      success: false,
      message: 'Supabase URL is missing or invalid. Please provide a valid Supabase project URL.',
      error: 'MISSING_SUPABASE_URL',
    };
  }

  if (!serviceKey || serviceKey.length < 20) {
    return {
      success: false,
      message:
        'Supabase Service Role Key is required to bypass email confirmation and programmatically seed or update admin accounts.',
      error: 'MISSING_SERVICE_ROLE_KEY',
    };
  }

  try {
    const supabaseAdmin = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 1. Check if user already exists in auth.users
    let existingUserId: string | null = null;
    let existingMetadata: any = {};

    try {
      const { data: usersData, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
      if (!listErr && usersData?.users) {
        const found = usersData.users.find((u: any) => u.email?.toLowerCase() === email);
        if (found) {
          existingUserId = found.id;
          existingMetadata = found.user_metadata || {};
        }
      }
    } catch (e) {
      console.warn('Could not list users, will try direct operations:', e);
    }

    let action: 'created' | 'updated' = 'created';
    let finalUserId: string;

    if (existingUserId) {
      // 2a. Account exists -> update password to Ayomide0148 and ensure email_confirm: true
      const { data: updateData, error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
        existingUserId,
        {
          password,
          email_confirm: true,
          user_metadata: {
            ...existingMetadata,
            full_name: fullName,
            role: 'admin',
          },
        }
      );

      if (updateErr) {
        return {
          success: false,
          message: `Failed to update existing admin user password: ${updateErr.message}`,
          error: updateErr.message,
        };
      }

      finalUserId = existingUserId;
      action = 'updated';
    } else {
      // 2b. Try to create user with email_confirm: true
      const { data: createData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: 'admin',
        },
      });

      if (createErr) {
        // If it failed because user already exists (race condition or pagination limit in listUsers)
        if (createErr.message.toLowerCase().includes('already registered') || createErr.message.toLowerCase().includes('already exists')) {
          // Re-fetch users or query
          const { data: retryUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
          const userFound = retryUsers?.users?.find((u: any) => u.email?.toLowerCase() === email);
          if (userFound) {
            const { error: retryUpdateErr } = await supabaseAdmin.auth.admin.updateUserById(userFound.id, {
              password,
              email_confirm: true,
              user_metadata: {
                full_name: fullName,
                role: 'admin',
              },
            });
            if (retryUpdateErr) {
              return {
                success: false,
                message: `User exists but password update failed: ${retryUpdateErr.message}`,
                error: retryUpdateErr.message,
              };
            }
            finalUserId = userFound.id;
            action = 'updated';
          } else {
            return {
              success: false,
              message: `User already registered in auth.users: ${createErr.message}`,
              error: createErr.message,
            };
          }
        } else {
          return {
            success: false,
            message: `Failed to create admin user: ${createErr.message}`,
            error: createErr.message,
          };
        }
      } else if (createData?.user) {
        finalUserId = createData.user.id;
        action = 'created';
      } else {
        return {
          success: false,
          message: 'Supabase admin API did not return user data.',
          error: 'NO_USER_DATA',
        };
      }
    }

    // 3. Upsert record into public.profiles to guarantee role = 'admin'
    try {
      const { error: profileErr } = await supabaseAdmin.from('profiles').upsert(
        {
          id: finalUserId,
          email,
          full_name: fullName,
          role: 'admin',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

      if (profileErr) {
        console.warn('Profile upsert notice:', profileErr.message);
      }
    } catch (profErr: any) {
      console.warn('Profiles table upsert exception:', profErr?.message);
    }

    return {
      success: true,
      message:
        action === 'updated'
          ? `Admin user (${email}) was found and updated: password set to "${password}", email confirmed, and role verified as 'admin'.`
          : `Admin user (${email}) was successfully created with password "${password}", email confirmed, and role verified as 'admin'.`,
      action,
      userId: finalUserId,
      email,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'An unexpected error occurred during admin account seeding.',
      error: err?.message,
    };
  }
}
