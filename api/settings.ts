import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './config/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { category } = req.query;

    // General Settings
    if (category === 'general') {
      if (req.method === 'GET') {
        const result = await query(
          "SELECT key, value FROM settings WHERE category = 'general'"
        );

        const settings: { [key: string]: string } = {};
        result.rows.forEach((row: any) => {
          settings[row.key] = row.value;
        });

        return res.status(200).json(settings);
      } else if (req.method === 'PUT') {
        const settingsData = req.body;

        for (const [key, value] of Object.entries(settingsData)) {
          await query(
            `INSERT INTO settings (category, key, value) 
             VALUES ('general', $1, $2) 
             ON CONFLICT (category, key) 
             DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
            [key, value]
          );
        }

        return res.status(200).json({ message: 'Settings updated successfully' });
      }
    }

    // Hero Settings
    if (category === 'hero') {
      if (req.method === 'GET') {
        const result = await query(
          "SELECT value FROM settings WHERE category = 'hero' AND key = 'background_image'"
        );

        if (result.rows.length === 0) {
          return res.status(200).json({ backgroundImage: null });
        }

        return res.status(200).json({
          backgroundImage: result.rows[0].value,
        });
      } else if (req.method === 'PUT') {
        const { backgroundImage } = req.body;

        if (!backgroundImage) {
          return res.status(400).json({ error: 'Background image URL is required' });
        }

        await query(
          `INSERT INTO settings (category, key, value) 
           VALUES ('hero', 'background_image', $1) 
           ON CONFLICT (category, key) 
           DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP`,
          [backgroundImage]
        );

        return res.status(200).json({
          backgroundImage: backgroundImage,
        });
      }
    }

    // Notification Settings
    if (category === 'notifications') {
      if (req.method === 'GET') {
        const emailResult = await query(
          "SELECT key, value FROM settings WHERE category = 'notifications_email'"
        );
        
        const whatsappResult = await query(
          "SELECT key, value FROM settings WHERE category = 'notifications_whatsapp'"
        );

        const emailSettings: { [key: string]: string } = {};
        emailResult.rows.forEach((row: any) => {
          emailSettings[row.key] = row.value;
        });

        const whatsappSettings: { [key: string]: string } = {};
        whatsappResult.rows.forEach((row: any) => {
          whatsappSettings[row.key] = row.value;
        });

        return res.status(200).json({
          email: emailSettings,
          whatsapp: whatsappSettings
        });
      } else if (req.method === 'PUT') {
        const { email, whatsapp } = req.body;

        if (email) {
          for (const [key, value] of Object.entries(email)) {
            await query(
              `INSERT INTO settings (category, key, value) 
               VALUES ('notifications_email', $1, $2) 
               ON CONFLICT (category, key) 
               DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
              [key, value]
            );
          }
        }

        if (whatsapp) {
          for (const [key, value] of Object.entries(whatsapp)) {
            await query(
              `INSERT INTO settings (category, key, value) 
               VALUES ('notifications_whatsapp', $1, $2) 
               ON CONFLICT (category, key) 
               DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
              [key, value]
            );
          }
        }

        return res.status(200).json({ message: 'Settings updated successfully' });
      }
    }

    // User Settings
    if (category === 'users') {
      if (req.method === 'GET') {
        const result = await query(
          "SELECT key, value FROM settings WHERE category = 'users'"
        );

        const settings: { [key: string]: string } = {};
        result.rows.forEach((row: any) => {
          settings[row.key] = row.value;
        });

        return res.status(200).json(settings);
      } else if (req.method === 'PUT') {
        const settingsData = req.body;

        for (const [key, value] of Object.entries(settingsData)) {
          await query(
            `INSERT INTO settings (category, key, value) 
             VALUES ('users', $1, $2) 
             ON CONFLICT (category, key) 
             DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
            [key, value]
          );
        }

        return res.status(200).json({ message: 'Settings updated successfully' });
      }
    }

    // Role Settings
    if (category === 'roles') {
      if (req.method === 'GET') {
        const result = await query(
          "SELECT key, value FROM settings WHERE category = 'roles'"
        );

        const settings: { [key: string]: string } = {};
        result.rows.forEach((row: any) => {
          settings[row.key] = row.value;
        });

        return res.status(200).json(settings);
      } else if (req.method === 'PUT') {
        const settingsData = req.body;

        for (const [key, value] of Object.entries(settingsData)) {
          await query(
            `INSERT INTO settings (category, key, value) 
             VALUES ('roles', $1, $2) 
             ON CONFLICT (category, key) 
             DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
            [key, value]
          );
        }

        return res.status(200).json({ message: 'Settings updated successfully' });
      }
    }

    // Cloudinary Settings
    if (category === 'cloudinary') {
      if (req.method === 'GET') {
        const result = await query(
          "SELECT key, value FROM settings WHERE category = 'cloudinary'"
        );

        const settings: { [key: string]: string } = {};
        result.rows.forEach((row: any) => {
          settings[row.key] = row.value;
        });

        return res.status(200).json(settings);
      } else if (req.method === 'PUT') {
        const settingsData = req.body;

        for (const [key, value] of Object.entries(settingsData)) {
          await query(
            `INSERT INTO settings (category, key, value) 
             VALUES ('cloudinary', $1, $2) 
             ON CONFLICT (category, key) 
             DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
            [key, value]
          );
        }

        return res.status(200).json({ message: 'Settings updated successfully' });
      }
    }

    // Maintenance Mode Settings
    if (category === 'maintenance') {
      if (req.method === 'GET') {
        const result = await query(
          "SELECT key, value FROM settings WHERE category = 'maintenance'"
        );

        const settings: { [key: string]: string } = {};
        result.rows.forEach((row: any) => {
          settings[row.key] = row.value;
        });

        return res.status(200).json(settings);
      } else if (req.method === 'PUT') {
        const settingsData = req.body;

        for (const [key, value] of Object.entries(settingsData)) {
          await query(
            `INSERT INTO settings (category, key, value) 
             VALUES ('maintenance', $1, $2) 
             ON CONFLICT (category, key) 
             DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
            [key, value]
          );
        }

        return res.status(200).json({ message: 'Settings updated successfully' });
      }
    }

    return res.status(400).json({ error: 'Invalid category' });
  } catch (error) {
    console.error('Error handling settings:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}