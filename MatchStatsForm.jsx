// MatchStatsForm.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

export default function MatchStatsForm({ matchId }) {
  const [players, setPlayers] = useState([]);
  const [stats, setStats] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  // Fine calculation rates
  const FINE_RATES = {
    SCORE_26: 0.26,      // £0.26 per 26
    MISS: 0.50,          // £0.50 per miss
    DOTD: 2.50,          // £2.50 for Dick of the Day
    // Tens: each score under 10 = that many pence (handled in calculation)
  };

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem(`match_${matchId}`);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setStats(parsed);
      } catch (err) {
        console.error('Failed to load saved data:', err);
      }
    }
  }, [matchId]);

  // Save data to localStorage whenever stats change
  useEffect(() => {
    if (stats.length > 0) {
      localStorage.setItem(`match_${matchId}`, JSON.stringify(stats));
    }
  }, [stats, matchId]);

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

    // Initialize stats only if not loaded from localStorage
    if (stats.length === 0) {
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
    }
  }, [stats.length]);

  // Check for duplicate players in singles matches
  const checkDuplicatePlayers = () => {
    const singlesPlayers = stats.slice(0, 5).map(leg => leg.player1_id).filter(id => id);
    const uniquePlayers = new Set(singlesPlayers);
    return singlesPlayers.length > uniquePlayers.size;
  };

  const getDuplicatePlayerStyle = (legIndex, playerId) => {
    if (legIndex >= 5 || !playerId) return {}; // Only check singles matches

    const singlesPlayers = stats.slice(0, 5).map(leg => leg.player1_id);
    const isDuplicate = singlesPlayers.filter(id => id === playerId).length > 1;

    return isDuplicate ? {
      border: '3px solid #dc3545',
      borderRadius: '6px',
      animation: 'pulse 2s infinite'
    } : {};
  };

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
    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', alignItems: 'center' }}>
      <button
        type="button"
        onClick={() => handleChange(i, field, Math.max(0, Number((player ? stats[i][player]?.[field] : stats[i][field]) || 0) - 1), player)}
        style={{
          width: '28px',
          height: '28px',
          fontSize: '16px',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        -
      </button>
      <span style={{
        minWidth: '25px',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: '16px',
        padding: '2px'
      }}>
        {player ? stats[i][player]?.[field] || 0 : stats[i][field]}
      </span>
      <button
        type="button"
        onClick={() => handleChange(i, field, Number((player ? stats[i][player]?.[field] : stats[i][field]) || 0) + 1, player)}
        style={{
          width: '28px',
          height: '28px',
          fontSize: '16px',
          backgroundColor: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
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
      style={{
        width: '100%',
        maxWidth: '80px',
        textAlign: 'center',
        padding: '6px',
        border: '1px solid #ddd',
        borderRadius: '6px',
        fontSize: '14px'
      }}
      placeholder={field === 'tens' ? 'e.g. 9,8,4' : ''}
    />
  );

  const handleSubmitAttempt = () => {
    if (checkDuplicatePlayers()) {
      setShowDuplicateWarning(true);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setMessage('');
    setShowDuplicateWarning(false);

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

      // Clear localStorage after successful submission
      localStorage.removeItem(`match_${matchId}`);

    } catch (err) {
      console.error('Submit error:', err);
      setMessage("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <h2>Loading...</h2>
        <p>Fetching players from database...</p>
      </div>
    );
  }

  return (
    <div style={{
      padding: '10px',
      maxWidth: '100%',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
          
          @media (max-width: 768px) {
            .match-table {
              font-size: 12px;
            }
            .match-table th, .match-table td {
              padding: 4px !important;
            }
            .match-table select {
              font-size: 12px;
              padding: 2px !important;
            }
          }
        `}
      </style>

      <div style={{
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ color: '#2c3e50', marginBottom: '10px' }}>Match Stats Entry</h2>
        <p style={{ color: '#6c757d', fontSize: '14px' }}>
          <strong>Match ID:</strong> {matchId}
        </p>
        <p style={{ color: '#6c757d', fontSize: '14px' }}>
          <em>Format: 5 Singles (Legs 1-5) + 2 Doubles (Legs 6-7)</em>
        </p>
      </div>

      {/* Duplicate Player Warning Modal */}
      {showDuplicateWarning && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            maxWidth: '400px',
            margin: '20px'
          }}>
            <h3 style={{ color: '#dc3545', marginBottom: '15px' }}>⚠️ Duplicate Player Warning</h3>
            <p style={{ marginBottom: '20px' }}>
              You have the same player selected for multiple singles matches. Are you sure you want to continue?
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDuplicateWarning(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Continue Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div style={{
          color: message.includes('Error') ? 'red' : 'green',
          padding: '12px',
          backgroundColor: message.includes('Error') ? '#f8d7da' : '#d4edda',
          borderRadius: '8px',
          border: `1px solid ${message.includes('Error') ? '#f5c6cb' : '#c3e6cb'}`,
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          {message}
        </div>
      )}

      {players.length === 0 && !loading && (
        <div style={{
          color: '#856404',
          padding: '12px',
          backgroundColor: '#fff3cd',
          borderRadius: '8px',
          border: '1px solid #ffeaa7',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          No players found in database. Please add some players to your profiles table.
        </div>
      )}

      <div style={{
        backgroundColor: '#fff',
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '20px',
        fontSize: '14px',
        textAlign: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <strong>Fine Rates:</strong> 26s: £0.26 each | Misses: £0.50 each | DOTD: £2.50 each | Tens: score in pence (e.g. 9 = 9p)
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table
          className="match-table"
          style={{
            borderCollapse: 'collapse',
            width: '100%',
            minWidth: '800px',
            backgroundColor: 'white',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#343a40', color: 'white' }}>
              <th style={{ padding: '12px', textAlign: 'center' }}>Leg</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Player</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Win</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Loss</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>100+</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>140+</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>180</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Checkout</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>26s</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Tens</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Miss</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>DOTD</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((row, i) => (
              <React.Fragment key={i}>
                <tr style={{
                  backgroundColor: i >= 5 ? '#fff3cd' : 'white',
                  borderBottom: '1px solid #dee2e6'
                }}>
                  <td rowSpan={i >= 5 ? 2 : 1} style={{
                    textAlign: 'center',
                    fontWeight: 'bold',
                    backgroundColor: i >= 5 ? '#ffc107' : '#007bff',
                    color: 'white',
                    padding: '12px'
                  }}>
                    {i + 1}
                    {i >= 5 && <><br /><small>Doubles</small></>}
                  </td>
                  <td style={{ padding: '8px' }}>
                    <select
                      value={row.player1_id}
                      onChange={e => handleChange(i, 'player1_id', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px',
                        borderRadius: '6px',
                        border: '1px solid #ddd',
                        fontSize: '14px',
                        ...getDuplicatePlayerStyle(i, row.player1_id)
                      }}
                    >
                      <option value="">--Select Player--</option>
                      {players.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.first_name} {p.last_name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className={i >= 5 ? "no-bottom-border" : ""} rowSpan={i >= 5 ? 2 : 1} style={{ padding: '8px' }}>
                    {renderTally(i, 'win')}
                  </td>
                  <td className={i >= 5 ? "no-bottom-border" : ""} rowSpan={i >= 5 ? 2 : 1} style={{ padding: '8px' }}>
                    {renderTally(i, 'loss')}
                  </td>
                  <td style={{ padding: '8px' }}>{renderTally(i, 'score_100')}</td>
                  <td style={{ padding: '8px' }}>{renderTally(i, 'score_140')}</td>
                  <td style={{ padding: '8px' }}>{renderTally(i, 'score_180')}</td>
                  <td style={{ padding: '8px' }}>{renderTextInput(i, 'highest_checkout')}</td>
                  <td style={{ padding: '8px' }}>{renderTally(i, 'score_26')}</td>
                  <td style={{ padding: '8px' }}>{renderTextInput(i, 'tens')}</td>
                  <td style={{ padding: '8px' }}>{renderTally(i, 'miss')}</td>
                  <td style={{ padding: '8px' }}>{renderTally(i, 'dotd')}</td>
                </tr>

                {i >= 5 && (
                  <tr style={{
                    backgroundColor: '#fff3cd',
                    borderBottom: '1px solid #dee2e6'
                  }}>
                    <td style={{ padding: '8px' }}>
                      <select
                        value={row.player2_id}
                        onChange={e => handleChange(i, 'player2_id', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px',
                          borderRadius: '6px',
                          border: '1px solid #ddd',
                          fontSize: '14px'
                        }}
                      >
                        <option value="">--Select Partner--</option>
                        {players.filter(p => p.id !== row.player1_id).map(p => (
                          <option key={p.id} value={p.id}>
                            {p.first_name} {p.last_name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '8px' }}>{renderTally(i, 'score_100', 'player2')}</td>
                    <td style={{ padding: '8px' }}>{renderTally(i, 'score_140', 'player2')}</td>
                    <td style={{ padding: '8px' }}>{renderTally(i, 'score_180', 'player2')}</td>
                    <td style={{ padding: '8px' }}>{renderTextInput(i, 'highest_checkout', 'player2')}</td>
                    <td style={{ padding: '8px' }}>{renderTally(i, 'score_26', 'player2')}</td>
                    <td style={{ padding: '8px' }}>{renderTextInput(i, 'tens', 'player2')}</td>
                    <td style={{ padding: '8px' }}>{renderTally(i, 'miss', 'player2')}</td>
                    <td style={{ padding: '8px' }}>{renderTally(i, 'dotd', 'player2')}</td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button
          onClick={handleSubmitAttempt}
          disabled={submitting}
          style={{
            padding: '16px 32px',
            fontSize: '16px',
            backgroundColor: submitting ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: submitting ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            fontWeight: 'bold'
          }}
        >
          {submitting ? 'Saving Stats & Calculating Fines...' : 'Submit All Stats & Calculate Fines'}
        </button>
      </div>
    </div>
  );
}