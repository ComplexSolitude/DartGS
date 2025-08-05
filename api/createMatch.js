// /api/createMatch.js
export default async function handler(req, res) {
  const match_id = req.body.match_id;

  try {
    const gasResponse = await fetch(
      `https://script.google.com/macros/s/AKfycbxBFjF3NOVGgVW59uZmPYECXG9k36LX_hKhMxGs7B1pFjMadx-0mHK-GHlIdFmVvzAK8A/exec?path=createMatch`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
