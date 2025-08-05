// /api/createMatch.js
export default async function handler(req, res) {
  const match_id = req.body.match_id;

  try {
    const gasResponse = await fetch(
      `https://script.google.com/macros/s/AKfycbwE_msBcUxGPeZxH7JAHnM7SnuKFTOfbnm0pe-CR2BChXeWcjr8WM_adAH4gVdFGEnaHQ/exec?path=createMatch`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ match_id }),
      }
    );

    const result = await gasResponse.text();
    return res.status(200).send(result);
  } catch (err) {
    return res.status(500).send('Proxy error: ' + err.message);
  }
}
