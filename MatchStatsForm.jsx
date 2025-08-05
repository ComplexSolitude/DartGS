import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

export default function MatchStatsForm({ matchId }) {
  const [players, setPlayers] = useState([]);
  const [stats, setStats] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fine calculation rates
  const FINE_RATES = {
    SCORE_26: 0.26,      // £0.26 per 26
    MISS: 0.50,          // £0.50 per miss
    DOTD: 2.50,          // £2.50 for Dick of the Day
    // Tens: each score under 10 = that many pence (handled in calculation)
  };

  useEffect(() => {
    async function fetchPlayers() {
      try {
        setLoading(true);
        console.log('Fetching players from Supabase...');

        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .order('first_name');

        if (error) {
          throw error;
        }

        console.log('Players data received:', data);
        setPlayers(data || []);

      } catch (err) {
        console.error('Failed to fetch players:', err);
        setMessage('Failed to load players: ' + err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPlayers();

    // Initialize stats - 5 singles (legs 1-5) + 2 doubles (legs 6-7)
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

  // Calculate fines for a player's stats
  const calculateFines = (playerStats) => {
    let totalFines = 0;

    // 26s: £0.26 each
    totalFines += playerStats.score_26 * FINE_RATES.SCORE_26;

    // Misses: £0.50 each
    totalFines += playerStats.miss * FINE_RATES.MISS;

    // DOTD: £2.50 each
    totalFines += playerStats.dotd * FINE_RATES.DOTD;

    // Tens: scores under 10 = that many pence
    if (playerStats.tens) {
      const tensScores = playerStats.tens.split(',').map(s => s.trim()).filter(s => s);
      tensScores.forEach(score => {
        const numScore = parseInt(score);
        if (!isNaN(numScore) && numScore < 10) {
          totalFines += numScore * 0.01; // Convert pence to pounds
        }
      });
    }

    return Math.round(totalFines * 100) / 100; // Round to 2 decimal places
  };

  const renderTally = (i, field, player = null) => (
    <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', alignItems: 'center' }}>
      <button
        type="button"
        onClick={() => handleChange(i, field, Math.max(0, Number((player ? stats[i][player]?.[field] : stats[i][field]) || 0) - 1), player)}
        style={{ width: '25px', height: '25px', fontSize: '14px' }}
      >
        -
      </button>
      <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 'bold' }}>
        {player ? stats[i][player]?.[field] || 0 : stats[i][field]}
      </span>
      <button
        type="button"
        onClick={() => handleChange(i, field, Number((player ? stats[i][player]?.[field] : stats[i][field]) || 0) + 1, player)}
        style={{ width: '25px', height: '25px', fontSize: '14px' }}
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
      style={{ width: '80px', textAlign: 'center', padding: '4px' }}
      placeholder={field === 'tens' ? 'e.g. 9,8,4' : ''}
    />
  );

  const handleSubmit = async () => {
    setSubmitting(true);
    setMessage('');

    try {
      // Prepare match stats entries
      const matchStatsEntries = [];
      const fineEntries = [];

      stats.forEach((entry, legIndex) => {
        // Process Player 1
        if (entry.player1_id) {
          const player1Stats = {
            match_id: matchId,
            player_id: entry.player1_id,
            win: entry.win,
            loss: entry.loss,
            score_100: entry.score_100,
            score_140: entry.score_140,
            score_180: entry.score_180,
            highest_checkout: entry.highest_checkout ? parseInt(entry.highest_checkout) : null,
            score_26: entry.score_26,
            tens: entry.tens,
            miss: entry.miss,
            dotd: entry.dotd,
            is_double: legIndex >= 5 // Legs 6-7 are doubles (index 5-6)
          };

          matchStatsEntries.push(player1Stats);

          // Calculate and add fines for Player 1
          const player1Fines = calculateFines({
            score_26: entry.score_26,
            tens: entry.tens,
            miss: entry.miss,
            dotd: entry.dotd
          });

          if (player1Fines > 0) {
            fineEntries.push({
              player_id: entry.player1_id,
              type: `Leg ${legIndex + 1} Fines`,
              amount: player1Fines
            });
          }
        }

        // Process Player 2 (for doubles legs)
        if (entry.player2_id && legIndex >= 5) {
          const player2Stats = {
            match_id: matchId,
            player_id: entry.player2_id,
            win: 0, // Win/loss shared with partner, so set to 0 for player 2
            loss: 0,
            score_100: entry.player2?.score_100 || 0,
            score_140: entry.player2?.score_140 || 0,
            score_180: entry.player2?.score_180 || 0,
            highest_checkout: entry.player2?.highest_checkout ? parseInt(entry.player2.highest_checkout) : null,
            score_26: entry.player2?.score_26 || 0,
            tens: entry.player2?.tens || '',
            miss: entry.player2?.miss || 0,
            dotd: entry.player2?.dotd || 0,
            is_double: true
          };

          matchStatsEntries.push(player2Stats);

          // Calculate and add fines for Player 2
          const player2Fines = calculateFines({
            score_26: entry.player2?.score_26 || 0,
            tens: entry.player2?.tens || '',
            miss: entry.player2?.miss || 0,
            dotd: entry.player2?.dotd || 0
          });

          if (player2Fines > 0) {
            fineEntries.push({
              player_id: entry.player2_id,
              type: `Leg ${legIndex + 1} Fines (Doubles)`,
              amount: player2Fines
            });
          }
        }
      });

      console.log('Submitting match stats:', matchStatsEntries);
      console.log('Submitting fines:', fineEntries);

      // Insert match stats
      const { error: statsError } = await supabase
        .from('match_stats')
        .insert(matchStatsEntries);

      if (statsError) {
        throw new Error('Failed to save match stats: ' + statsError.message);
      }

      // Insert fines
      if (fineEntries.length > 0) {
        const { error: finesError } = await supabase
          .from('fines')
          .insert(fineEntries);

        if (finesError) {
          throw new Error('Failed to save fines: ' + finesError.message);
        }
      }

      const totalFineAmount = fineEntries.reduce((sum, fine) => sum + fine.amount, 0);
      setMessage(`Match stats and fines saved successfully! Total fines: £${totalFineAmount.toFixed(2)}`);

    } catch (err) {
      console.error('Submit error:', err);
      setMessage("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Loading...</h2>
        <p>Fetching players from database...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Match Stats Entry</h2>
      <p><strong>Match ID:</strong> {matchId}</p>
      <p><em>Format: 5 Singles (Legs 1-5) + 2 Doubles (Legs 6-7)</em></p>

      {message && (
        <div style={{
          color: message.includes('Error') ? 'red' : 'green',
          padding: '12px',
          backgroundColor: message.includes('Error') ? '#ffebee' : '#e8f5e8',
          borderRadius: '6px',
          border: `1px solid ${message.includes('Error') ? '#f44336' : '#4caf50'}`,
          marginBottom: '20px'
        }}>
          {message}
        </div>
      )}

      {players.length === 0 && !loading && (
        <div style={{
          color: 'orange',
          padding: '12px',
          backgroundColor: '#fff3cd',
          borderRadius: '6px',
          border: '1px solid #ffc107',
          marginBottom: '20px'
        }}>
          No players found in database. Please add some players to your profiles table.
        </div>
      )}

      {/* Fine Rates Info */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '12px',
        borderRadius: '6px',
        marginBottom: '20px',
        fontSize: '14px'
      }}>
        <strong>Fine Rates:</strong> 26s: £0.26 each | Misses: £0.50 each | DOTD: £2.50 each | Tens: score in pence (e.g. 9 = 9p)
      </div>

      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th>Leg</th>
            <th>Player</th>
            <th>Win</th>
            <th>Loss</th>
            <th>100+</th>
            <th>140+</th>
            <th>180</th>
            <th>Checkout</th>
            <th>26s</th>
            <th>Tens</th>
            <th>Miss</th>
            <th>DOTD</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((row, i) => (
            <React.Fragment key={i}>
              <tr style={{ backgroundColor: i >= 5 ? '#fff3cd' : 'white' }}>
                <td rowSpan={i >= 5 ? 2 : 1} style={{
                  textAlign: 'center',
                  fontWeight: 'bold',
                  backgroundColor: i >= 5 ? '#ffc107' : '#007bff',
                  color: 'white'
                }}>
                  {i + 1}
                  {i >= 5 && <br /><small>Doubles</small>}
                </td>
                <td>
                  <select
                    value={row.player1_id}
                    onChange={e => handleChange(i, 'player1_id', e.target.value)}
                    style={{ width: '100%', padding: '6px' }}
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
                <tr style={{ backgroundColor: '#fff3cd' }}>
                  <td>
                    <select
                      value={row.player2_id}
                      onChange={e => handleChange(i, 'player2_id', e.target.value)}
                      style={{ width: '100%', padding: '6px' }}
                    >
                      <option value="">--Select Partner--</option>
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

      <button
        onClick={handleSubmit}
        disabled={submitting}
        style={{
          marginTop: '20px',
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: submitting ? '#ccc' : '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: submitting ? 'not-allowed' : 'pointer'
        }}
      >
        {submitting ? 'Saving Stats & Calculating Fines...' : 'Submit All Stats & Calculate Fines'}
      </button>
    </div>
  );
}