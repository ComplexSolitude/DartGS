export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const googleScriptUrl = 'https://script.google.com/macros/s/AKfycbwE_msBcUxGPeZxH7JAHnM7SnuKFTOfbnm0pe-CR2BChXeWcjr8WM_adAH4gVdFGEnaHQ/exec?path=createMatch';

  try {
    const response = await fetch(googleScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    const text = await response.text();
    return res.status(200).send(text);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}