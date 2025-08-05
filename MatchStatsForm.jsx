import React, { useEffect, useState } from 'react';

export default function MatchStatsForm({ matchId }) {
  const [players, setPlayers] = useState([]);
  const [stats, setStats] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function fetchPlayers() {
      try {
        const res = await fetch('https://script.google.com/macros/s/AKfycbwV7Ixok0BWOxaLz-YluvCcJApsHZRbYQrBhh2CNpiJP-bV4529fPp_fa2i8rthX37B-w/exec'); // Replace with your actual deployed Apps Script GET URL
        const data = await res.json();
        setPlayers(data);
      } catch (err) {
        console.error('Failed to fetch players', err);
      }
    }

    fetchPlayers();

    const initialStats = Array(7).fill(null).map(() => ({
      player1_id: '',
      player2_id: '',
      win: 0,
      loss: 0,
      score_100: 0,
      score_140: 0,
      score_180: 0,
      highest_checkout: '',
      score_26: 0,
      tens: '',
      miss: 0,
      dotd: 0,
    }));

    setStats(initialStats);
  }, []);

  const handleChange = (index, field, value, player = null) => {
    const updated = [...stats];
    if (player) {
      updated[index][player] = {
        ...updated[index][player],
        [field]: value
      };
    } else {
      updated[index][field] = value;
    }
    setStats(updated);
  };

  const renderTally = (i, field, player = null) => (
    <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', alignItems: 'center' }}>
      <button onClick={() => handleChange(i, field, Math.max(0, Number((player ? stats[i][player]?.[field] : stats[i][field]) || 0) - 1), player)}>-</button>
      <span>{player ? stats[i][player]?.[field] || 0 : stats[i][field]}</span>
      <button onClick={() => handleChange(i, field, Number((player ? stats[i][player]?.[field] : stats[i][field]) || 0) + 1, player)}>+</button>
    </div>
  );

  const renderTextInput = (i, field, player = null) => (
    <input
      type="text"
      value={player ? stats[i][player]?.[field] || '' : stats[i][field]}
      onChange={e => handleChange(i, field, e.target.value, player)}
      style={{ width: '60px' }}
    />
  );

  const handleSubmit = async () => {
    const entries = stats.map((entry, index) => {
      const data = [];

      if (entry.player1_id) {
        data.push({
          match_id: matchId,
          player_id: entry.player1_id,
          win: entry.win,
          loss: entry.loss,
          score_100: entry.score_100,
          score_140: entry.score_140,
          score_180: entry.score_180,
          highest_checkout: entry.highest_checkout,
          score_26: entry.score_26,
          tens: entry.tens,
          miss: entry.miss,
          dotd: entry.dotd,
          is_double: index >= 5
        });
      }

      if (entry.player2_id) {
        data.push({
          match_id: matchId,
          player_id: entry.player2_id,
          win: 0,
          loss: 0,
          score_100: entry.player2?.score_100 || 0,
          score_140: entry.player2?.score_140 || 0,
          score_180: entry.player2?.score_180 || 0,
          highest_checkout: entry.player2?.highest_checkout || '',
          score_26: entry.player2?.score_26 || 0,
          tens: entry.player2?.tens || '',
          miss: entry.player2?.miss || 0,
          dotd: entry.player2?.dotd || 0,
          is_double: true
        });
      }

      return data;
    }).flat();

    try {
      const res = await fetch("https://script.google.com/macros/s/AKfycbwE_msBcUxGPeZxH7JAHnM7SnuKFTOfbnm0pe-CR2BChXeWcjr8WM_adAH4gVdFGEnaHQ/exec", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(entries)
      });

      const text = await res.text();
      setMessage(text === "Success" ? "Stats saved!" : "Error: " + text);
    } catch (err) {
      setMessage("Error: " + err.message);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Match Stats Entry</h2>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>Leg</th>
            <th>Player</th>
            <th>Win</th>
            <th>Loss</th>
            <th>100+</th>
            <th>140+</th>
            <th>180</th>
            <th>Checkout</th>
            <th>26</th>
            <th>10s</th>
            <th>Miss</th>
            <th>DOTD</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((row, i) => (
            <React.Fragment key={i}>
              <tr>
                <td rowSpan={i >= 5 ? 2 : 1}>{i + 1}</td>
                <td>
                  <select value={row.player1_id} onChange={e => handleChange(i, 'player1_id', e.target.value)}>
                    <option value="">--</option>
                    {players.map(p => (
                      <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                    ))}
                  </select>
                </td>
                <td rowSpan={i >= 5 ? 2 : 1}>{renderTally(i, 'win')}</td>
                <td rowSpan={i >= 5 ? 2 : 1}>{renderTally(i, 'loss')}</td>
                <td>{renderTally(i, 'score_100')}</td>
                <td>{renderTally(i, 'score_140')}</td>
                <td>{renderTally(i, 'score_180')}</td>
                <td>{renderTextInput(i, 'highest_checkout')}</td>
                <td>{renderTally(i, 'score_26')}</td>
                <td>{renderTextInput(i, 'tens')}</td>
                <td>{renderTally(i, 'miss')}</td>
                <td>{renderTally(i, 'dotd')}</td>
              </tr>

              {i >= 5 && (
                <tr>
                  <td>
                    <select value={row.player2_id} onChange={e => handleChange(i, 'player2_id', e.target.value)}>
                      <option value="">--</option>
                      {players.filter(p => p.id !== row.player1_id).map(p => (
                        <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                      ))}
                    </select>
                  </td>
                  <td>{renderTally(i, 'score_100', 'player2')}</td>
                  <td>{renderTally(i, 'score_140', 'player2')}</td>
                  <td>{renderTally(i, 'score_180', 'player2')}</td>
                  <td>{renderTextInput(i, 'highest_checkout', 'player2')}</td>
                  <td>{renderTally(i, 'score_26', 'player2')}</td>
                  <td>{renderTextInput(i, 'tens', 'player2')}</td>
                  <td>{renderTally(i, 'miss', 'player2')}</td>
                  <td>{renderTally(i, 'dotd', 'player2')}</td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      <button onClick={handleSubmit} style={{ marginTop: '10px' }}>Submit All Stats</button>
    </div>
  );
}
