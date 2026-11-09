import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { seedAdminUser, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD } from './src/lib/adminSeeder';

// Global error handlers to prevent unhandled rejections from crashing the server
process.on('uncaughtException', (err) => {
  console.error('[AjmanTech Server] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[AjmanTech Server] Unhandled Rejection at:', promise, 'reason:', reason);
});

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

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
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_KEY ||
        process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
        (req.headers['x-service-role-key'] as string) ||
        req.body?.serviceRoleKey;

      if (!serviceRoleKey) {
        return res.status(500).json({
          error: 'Missing SUPABASE_SERVICE_ROLE_KEY environment variable',
        });
      }

      const email = 'joshuaajayi0148@gmail.com';
      const password = 'Ayomide0148';
      const supabaseUrl =
        (req.body?.supabaseUrl as string) ||
        process.env.VITE_SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.SUPABASE_URL ||
        'https://ynrmthgxykbvuvtwhvlq.supabase.co';

      const result = await seedAdminUser({
        supabaseUrl,
        serviceRoleKey,
        email,
        password,
        fullName: req.body?.fullName || 'Joshua Ajayi',
      });

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: 'Admin account seeded successfully',
        });
      } else {
        return res.status(500).json({
          error: result.message || 'Failed to seed admin user',
        });
      }
    } catch (err: any) {
      console.error('API seed-admin error:', err);
      return res.status(500).json({
        error: err?.message || 'Failed to seed admin account',
      });
    }
  };

  app.post('/api/seed-admin', handleSeedAdmin);
  app.get('/api/seed-admin', handleSeedAdmin);
  app.post('/api/init-admin', handleSeedAdmin);
  app.get('/api/init-admin', handleSeedAdmin);

  // Vite middleware for development vs Static assets for production
  const distPath = path.join(process.cwd(), 'dist');
  const isProduction = process.env.NODE_ENV === 'production' && fs.existsSync(distPath);

  if (!isProduction) {
    const vite = await createViteServer({
      root: process.cwd(),
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
      try {
        const url = req.originalUrl;
        const indexPath = path.resolve(process.cwd(), 'index.html');
        if (fs.existsSync(indexPath)) {
          let template = fs.readFileSync(indexPath, 'utf-8');
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
        } else {
          next();
        }
      } catch (e) {
        next(e);
      }
    });
  } else {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AjmanTech Server] Running on http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[AjmanTech Server] Port ${PORT} already in use.`);
    } else {
      console.error('[AjmanTech Server] Server listen error:', err);
    }
  });
}

startServer();
