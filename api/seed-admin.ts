import { seedAdminUser, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD } from '../src/lib/adminSeeder';

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-service-role-key, authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const serviceRoleKey =
      req.headers['x-service-role-key'] ||
      req.body?.serviceRoleKey ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

    const email = req.body?.email || req.query?.email || DEFAULT_ADMIN_EMAIL;
    const password = req.body?.password || req.query?.password || DEFAULT_ADMIN_PASSWORD;
    const supabaseUrl = req.body?.supabaseUrl || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;

    if (!serviceRoleKey) {
      return res.status(400).json({
        success: false,
        message:
          'Supabase Service Role Key is required. Set SUPABASE_SERVICE_ROLE_KEY in your environment, or pass x-service-role-key header or { serviceRoleKey } in the request body.',
        email,
      });
    }

    const result = await seedAdminUser({
      supabaseUrl,
      serviceRoleKey,
      email,
      password,
      fullName: req.body?.fullName || 'Joshua Ajayi',
    });

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || 'Internal server error while seeding admin account',
    });
  }
}
