// api/submitStats.js
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const entries = req.body;

    // Log the data for now - later you can save to Google Sheets
    console.log('Received match stats:', JSON.stringify(entries, null, 2));

    // Simulate successful save
    return res.status(200).send("Success");

  } catch (err) {
    console.error('Error saving stats:', err);
    return res.status(500).send('Error: ' + err.message);
  }
}