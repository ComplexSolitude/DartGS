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

    const gasResponse = await fetch(
      `https://script.google.com/macros/s/AKfycbxNYIDgPTRsN412kBnvfxcD9zwaPcr4Xpq-b4usQWO1ZWNNGkfJpwlGmQOINEClbG5vdg/exec?path=createMatch`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ match_id }),
      }
    );

    const result = await gasResponse.text();
    console.log('GAS response:', result); // Add logging

    return res.status(200).send(result);
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).send('Proxy error: ' + err.message);
  }
}