import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { seedAdminUser, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD } from './src/lib/adminSeeder';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsing & JSON
  app.use(express.json());

  // CORS middleware
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-service-role-key'
    );
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // 1. Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'ajmantech-api',
      timestamp: new Date().toISOString(),
    });
  });

  // 2. Admin Seeding Endpoint (/api/seed-admin and /api/init-admin)
  const handleSeedAdmin = async (req: express.Request, res: express.Response) => {
    try {
      const serviceRoleKey =
        (req.headers['x-service-role-key'] as string) ||
        req.body?.serviceRoleKey ||
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

      const email = (req.body?.email || req.query?.email || DEFAULT_ADMIN_EMAIL) as string;
      const password = (req.body?.password || req.query?.password || DEFAULT_ADMIN_PASSWORD) as string;
      const supabaseUrl = (req.body?.supabaseUrl || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL) as string;

      if (!serviceRoleKey) {
        return res.status(400).json({
          success: false,
          message:
            'Supabase Service Role Key is required to bypass email verification and seed admin users. Provide it in SUPABASE_SERVICE_ROLE_KEY environment variable, x-service-role-key header, or request body { serviceRoleKey }.',
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
    } catch (err: any) {
      console.error('API seed-admin error:', err);
      return res.status(500).json({
        success: false,
        message: err?.message || 'Server error while executing admin seed',
      });
    }
  };

  app.post('/api/seed-admin', handleSeedAdmin);
  app.get('/api/seed-admin', handleSeedAdmin);
  app.post('/api/init-admin', handleSeedAdmin);
  app.get('/api/init-admin', handleSeedAdmin);

  // Vite middleware for development vs Static assets for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
