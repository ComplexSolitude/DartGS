/ api/players.js
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Hardcoded players for now - you can replace this with Google Sheets API call later
    const players = [
      { id: 1, first_name: "John", last_name: "Doe" },
      { id: 2, first_name: "Jane", last_name: "Smith" },
      { id: 3, first_name: "Mike", last_name: "Johnson" },
      { id: 4, first_name: "Sarah", last_name: "Wilson" },
      { id: 5, first_name: "David", last_name: "Brown" }
    ];

    return res.status(200).json(players);
  } catch (err) {
    console.error('Error fetching players:', err);
    return res.status(500).json({ error: 'Failed to fetch players' });
  }
}