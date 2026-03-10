import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid URL parameter' });
    }

    // Validate URL is a valid iCal URL
    if (!url.includes('ical') && !url.includes('.ics')) {
      return res.status(400).json({ error: 'Invalid iCal URL' });
    }

    // Fetch the iCal data from the external URL
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Skyway-Suites-Calendar-Sync/1.0',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch iCal:', response.statusText);
      return res.status(response.status).json({ 
        error: `Failed to fetch iCal: ${response.statusText}` 
      });
    }

    const icalData = await response.text();

    // Return the iCal data
    res.setHeader('Content-Type', 'text/calendar');
    return res.status(200).send(icalData);
  } catch (error) {
    console.error('Error proxying iCal:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to proxy iCal data' 
    });
  }
}
