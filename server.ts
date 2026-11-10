import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { Resend } from 'resend';
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

  // 3. Automated Order Confirmation Email Endpoint (/api/send-order-email)
  app.post('/api/send-order-email', async (req: express.Request, res: express.Response) => {
    try {
      const body = req.body || {};
      const orderNumber = body.orderNumber || body.orderId || body.id;
      const customerEmail = body.customerEmail || body.email;
      const customerName = body.customerName || body.name || 'Valued Customer';
      const customerPhone = body.customerPhone || body.phone;
      const deliveryAddress = body.deliveryAddress || body.address;
      const items = body.items || [];
      const totalAmount = body.totalAmount || body.amount || 0;
      const deliveryFee = body.deliveryFee || 0;
      const paymentReference = body.paymentReference || body.reference;
      const paidAt = body.paidAt;

      if (!customerEmail || !orderNumber) {
        return res.status(400).json({ error: 'Missing customerEmail or orderNumber' });
      }

      const formattedTotal = '₦' + Number(totalAmount || 0).toLocaleString('en-NG');
      const formattedFee = deliveryFee ? '₦' + Number(deliveryFee).toLocaleString('en-NG') : 'Free';
      const addressText = typeof deliveryAddress === 'string'
        ? deliveryAddress
        : [
            deliveryAddress?.streetAddress || deliveryAddress?.address,
            deliveryAddress?.city,
            deliveryAddress?.state,
          ].filter(Boolean).join(', ') || 'Lagos, Nigeria';

      const itemsHtml = Array.isArray(items) && items.length > 0
        ? items.map((it: any) => `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px 8px; font-size: 13px; color: #1e293b;">
              <strong>${it.productName || it.title || it.name || 'Electrical Product'}</strong>
              ${it.variant || it.selectedVariant ? `<div style="font-size: 11px; color: #64748b;">Variant: ${it.variant || it.selectedVariant}</div>` : ''}
            </td>
            <td style="padding: 12px 8px; font-size: 13px; text-align: center; color: #475569;">x${it.quantity || 1}</td>
            <td style="padding: 12px 8px; font-size: 13px; text-align: right; font-weight: 600; color: #002D72;">
              ₦${(Number(it.price || 0) * Number(it.quantity || 1)).toLocaleString('en-NG')}
            </td>
          </tr>
        `).join('')
        : `<tr><td colspan="3" style="padding: 12px; font-size: 13px; color: #64748b;">Order details recorded with reference ${paymentReference || 'N/A'}</td></tr>`;

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <title>AjmanTech Services Order Confirmation</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 24px 12px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); max-width: 100%;">
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #002D72; padding: 32px 24px; text-align: center;">
                      <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">AjmanTech Services</h1>
                      <p style="margin: 6px 0 0; font-size: 13px; color: #93c5fd; font-style: italic;">“Let There Be Light” • Electrical & Lighting Solutions</p>
                    </td>
                  </tr>

                  <!-- Confirmation Banner -->
                  <tr>
                    <td style="padding: 24px 24px 16px; text-align: center; background-color: #f0fdf4; border-bottom: 1px solid #bbf7d0;">
                      <div style="display: inline-block; background-color: #16a34a; color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 4px 12px; border-radius: 12px; margin-bottom: 8px;">
                        ✓ Payment Confirmed via Paystack
                      </div>
                      <h2 style="margin: 4px 0 0; font-size: 18px; color: #166534; font-weight: 700;">Thank You for Your Order, ${customerName || 'Valued Customer'}!</h2>
                      <p style="margin: 4px 0 0; font-size: 13px; color: #15803d;">Your payment has been approved and your order is being tested and packed.</p>
                    </td>
                  </tr>

                  <!-- Order Meta -->
                  <tr>
                    <td style="padding: 20px 24px; border-bottom: 1px solid #e2e8f0;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="font-size: 13px; color: #64748b; line-height: 1.5;">
                            <div>Order Reference: <strong style="color: #002D72; font-family: monospace;">#${orderNumber}</strong></div>
                            <div>Paystack Ref: <strong style="color: #0f172a; font-family: monospace;">${paymentReference || 'VERIFIED'}</strong></div>
                            <div>Date: <strong>${paidAt ? new Date(paidAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}</strong></div>
                          </td>
                          <td align="right" style="font-size: 13px; color: #64748b; line-height: 1.5;">
                            <div>Payment Method: <strong style="color: #16a34a;">Paystack Card / Gateway</strong></div>
                            <div>Status: <strong style="color: #16a34a;">PAID & CONFIRMED</strong></div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Items Table -->
                  <tr>
                    <td style="padding: 20px 24px;">
                      <h3 style="margin: 0 0 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #002D72;">Order Summary</h3>
                      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                        <thead>
                          <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1; text-align: left;">
                            <th style="padding: 10px 8px; font-size: 12px; color: #475569; text-transform: uppercase;">Product / Item</th>
                            <th style="padding: 10px 8px; font-size: 12px; color: #475569; text-transform: uppercase; text-align: center;">Qty</th>
                            <th style="padding: 10px 8px; font-size: 12px; color: #475569; text-transform: uppercase; text-align: right;">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${itemsHtml}
                        </tbody>
                      </table>
                    </td>
                  </tr>

                  <!-- Totals Breakdown -->
                  <tr>
                    <td style="padding: 0 24px 20px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="border-top: 2px solid #e2e8f0; padding-top: 12px;">
                        <tr>
                          <td style="font-size: 13px; color: #64748b; padding: 4px 0;">Delivery Fee:</td>
                          <td align="right" style="font-size: 13px; color: #1e293b; padding: 4px 0; font-weight: 500;">${formattedFee}</td>
                        </tr>
                        <tr>
                          <td style="font-size: 16px; color: #0f172a; font-weight: 800; padding: 8px 0 0;">Total Paid:</td>
                          <td align="right" style="font-size: 18px; color: #002D72; font-weight: 800; padding: 8px 0 0;">${formattedTotal}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Shipping Destination -->
                  <tr>
                    <td style="padding: 16px 24px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">
                      <h4 style="margin: 0 0 6px; font-size: 13px; color: #002D72; text-transform: uppercase; letter-spacing: 0.5px;">Delivery Destination</h4>
                      <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.4;">
                        ${addressText}<br />
                        Recipient Contact: <strong>${customerPhone || 'N/A'}</strong>
                      </p>
                    </td>
                  </tr>

                  <!-- Actions / Tracking -->
                  <tr>
                    <td style="padding: 24px; text-align: center;">
                      <p style="margin: 0 0 16px; font-size: 13px; color: #475569;">
                        You can track live dispatch coordinates anytime using your Order Reference and Email address.
                      </p>
                      <a href="${process.env.APP_URL || 'http://localhost:3000'}/track?ref=${orderNumber}&email=${encodeURIComponent(customerEmail)}" style="display: inline-block; background-color: #0047AB; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 12px 24px; border-radius: 999px; box-shadow: 0 2px 6px rgba(0,71,171,0.25);">
                        Track Your Order Live
                      </a>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #0f172a; padding: 24px; text-align: center; color: #94a3b8; font-size: 11px; line-height: 1.5;">
                      <p style="margin: 0 0 4px; color: #ffffff; font-weight: 700; font-size: 12px;">AjmanTech Services Nigeria Ltd</p>
                      <p style="margin: 0 0 4px;">Folabi Oyeyemi, Royalty Road, Ikota Villa Estate, Lekki, Lagos, Nigeria</p>
                      <p style="margin: 0;">Hotline: +234 807 532 9182 • WhatsApp: +234 807 532 9182 • Email: orders@ajmantech.ng</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const resendApiKey = process.env.RESEND_API_KEY || (process.env as any).VITE_RESEND_API_KEY;
      if (resendApiKey && resendApiKey.startsWith('re_')) {
        const resend = new Resend(resendApiKey);
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'AjmanTech Services <onboarding@resend.dev>';
        const result = await resend.emails.send({
          from: fromEmail,
          to: customerEmail,
          subject: `AjmanTech Order Confirmed: #${orderNumber} [Payment Verified]`,
          html: emailHtml,
        });

        console.log('[Resend Email Service] Order confirmation email sent successfully:', result);
        return res.status(200).json({
          success: true,
          provider: 'resend',
          id: result?.data?.id,
          message: 'Order confirmation email sent via Resend',
        });
      }

      // Safe fallback logging when RESEND_API_KEY is not yet populated
      console.log(`[Email Confirmation Service] Order confirmation email generated for ${customerEmail}`);
      console.log(`Order: #${orderNumber} | Paystack Ref: ${paymentReference} | Total: ${formattedTotal}`);

      return res.status(200).json({
        success: true,
        provider: 'simulated',
        message: `Order confirmation email generated and queued for ${customerEmail}`,
      });
    } catch (err: any) {
      console.error('[Email Confirmation Service Error]:', err);
      return res.status(500).json({
        error: err?.message || 'Failed to send confirmation email',
      });
    }
  });

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
