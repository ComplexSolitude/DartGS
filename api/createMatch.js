// /api/createMatch.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the request body
    let match_id;
    if (typeof req.body === 'string') {
      const parsed = JSON.parse(req.body);
      match_id = parsed.match_id;
    } else {
      match_id = req.body.match_id;
    }

    if (!match_id) {
      return res.status(400).json({ error: 'match_id is required' });
    }

    console.log('Creating match with ID:', match_id); // Add logging

    // For now, just simulate match creation success
    // Later you can add Google Sheets API integration here
    console.log('Creating match:', match_id);

    // Simulate successful match creation
    return res.status(200).send("Match sheet created");
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).send('Proxy error: ' + err.message);
  }
}