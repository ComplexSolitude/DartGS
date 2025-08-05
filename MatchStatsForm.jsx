import React, { useEffect, useState } from 'react';

export default function MatchStatsForm({ matchId }) {
  const [players, setPlayers] = useState([]);
  const [stats, setStats] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlayers() {
      try {
        setLoading(true);
        console.log('Fetching players...'); // Debug log

        const res = await fetch(
          `https://script.google.com/macros/s/AKfycbxBFjF3NOVGgVW59uZmPYECXG9k36LX_hKhMxGs7B1pFjMadx-0mHK-GHlIdFmVvzAK8A/exec`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            }
          }
        );

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        console.log('Players data received:', data); // Debug log

        setPlayers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch players:', err);
        setMessage('Failed to load players: ' + err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPlayers();

    // Initialize stats with proper structure
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
      player2: {
        score_100: 0,
        score_140: 0,
        score_180: 0,
        highest_checkout: '',
        score_26: 0,
        tens: '',
        miss: 0,
        dotd: 0,
      }
    }));

    setStats(initialStats);
  }, []);

  const handleChange = (index, field, value, player = null) => {
    const updated = [...stats];
    if (player) {
      if (!updated[index][player]) {
        updated[index][player] = {};
      }
      updated[index][player][field] = value;
    } else {
      updated[index][field] = value;
    }
    setStats(updated);
  };

  const renderTally = (i, field, player = null) => (
    <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', alignItems: 'center' }}>
      <button
        type="button"
        onClick={() => handleChange(i, field, Math.max(0, Number((player ? stats[i][player]?.[field] : stats[i][field]) || 0) - 1), player)}
      >
        -
      </button>
      <span style={{ minWidth: '20px', textAlign: 'center' }}>
        {player ? stats[i][player]?.[field] || 0 : stats[i][field]}
      </span>
      <button
        type="button"
        onClick={() => handleChange(i, field, Number((player ? stats[i][player]?.[field] : stats[i][field]) || 0) + 1, player)}
      >
        +
      </button>
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
    try {
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

      console.log('Submitting entries:', entries); // Debug log

      const res = await fetch(
        `https://script.google.com/macros/s/AKfycbxBFjF3NOVGgVW59uZmPYECXG9k36LX_hKhMxGs7B1pFjMadx-0mHK-GHlIdFmVvzAK8A/exec`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(entries)
        }
      );

      const text = await res.text();
      console.log('Submit response:', text); // Debug log

      setMessage(text === "Success" ? "Stats saved!" : "Error: " + text);
    } catch (err) {
      console.error('Submit error:', err);
      setMessage("Error: " + err.message);
    }
  };

  if (loading) {
    return <div style={{ padding: 20 }}>Loading players...</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Match Stats Entry - {matchId}</h2>
      {message && <p style={{ color: message.includes('Error') ? 'red' : 'green' }}>{message}</p>}

      {players.length === 0 && (
        <p style={{ color: 'orange' }}>No players loaded. Check console for errors.</p>
      )}

      <table border="1" cellPadding="5" style={{ borderCollapse: 'collapse' }}>
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
                  <select
                    value={row.player1_id}
                    onChange={e => handleChange(i, 'player1_id', e.target.value)}
                  >
                    <option value="">--Select Player--</option>
                    {players.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.first_name} {p.last_name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className={i >= 5 ? "no-bottom-border" : ""} rowSpan={i >= 5 ? 2 : 1}>
                  {renderTally(i, 'win')}
                </td>
                <td className={i >= 5 ? "no-bottom-border" : ""} rowSpan={i >= 5 ? 2 : 1}>
                  {renderTally(i, 'loss')}
                </td>
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
                    <select
                      value={row.player2_id}
                      onChange={e => handleChange(i, 'player2_id', e.target.value)}
                    >
                      <option value="">--Select Player--</option>
                      {players.filter(p => p.id !== row.player1_id).map(p => (
                        <option key={p.id} value={p.id}>
                          {p.first_name} {p.last_name}
                        </option>
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
      <button onClick={handleSubmit} style={{ marginTop: '10px', padding: '10px 20px' }}>
        Submit All Stats
      </button>
    </div>
  );
}