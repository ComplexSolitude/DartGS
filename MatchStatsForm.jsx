import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

export default function MatchStatsForm({ matchId }) {
  const [players, setPlayers] = useState([]);
  const [stats, setStats] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  const FINE_RATES = {
    SCORE_26: 0.26,
    MISS: 0.50,
    DOTD: 2.50,
  };

  const getPlayerColumnWidth = () => {
    if (players.length === 0) return '140px';

  const longestName = players.reduce((longest, player) => {
    return player.first_name.length > longest.length ? player.first_name : longest;
  }, '--Select Player--'); // Include the placeholder text

    // More accurate estimation: ~9px per character + padding + dropdown arrow
    const estimatedWidth = Math.max(140, longestName.length * 9 + 60);
    return `${estimatedWidth}px`;
  };

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

  useEffect(() => {
    if (stats.length > 0) {
      localStorage.setItem(`match_${matchId}`, JSON.stringify(stats));
    }
  }, [stats, matchId]);

  useEffect(() => {
    async function fetchPlayers() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .order('first_name');

        if (error) throw error;
        setPlayers(data || []);
      } catch (err) {
        console.error('Failed to fetch players:', err);
        setMessage('Failed to load players: ' + err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPlayers();

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

  const checkDuplicatePlayers = () => {
    const singlesPlayers = stats.slice(0, 5).map(leg => leg.player1_id).filter(id => id);
    const uniquePlayers = new Set(singlesPlayers);
    return singlesPlayers.length > uniquePlayers.size;
  };

  const getDuplicatePlayerStyle = (legIndex, playerId) => {
    if (legIndex >= 5 || !playerId) return {};
    const singlesPlayers = stats.slice(0, 5).map(leg => leg.player1_id);
    const isDuplicate = singlesPlayers.filter(id => id === playerId).length > 1;
    return isDuplicate ? {
      border: '3px solid #ecf0f1',
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

  const calculateFines = (playerStats) => {
    let totalFines = 0;
    totalFines += playerStats.score_26 * FINE_RATES.SCORE_26;
    totalFines += playerStats.miss * FINE_RATES.MISS;
    totalFines += playerStats.dotd * FINE_RATES.DOTD;

    if (playerStats.tens) {
      const tensScores = playerStats.tens.split(',').map(s => s.trim()).filter(s => s);
      tensScores.forEach(score => {
        const numScore = parseInt(score);
        if (!isNaN(numScore) && numScore < 10) {
          totalFines += numScore * 0.01;
        }
      });
    }
    return Math.round(totalFines * 100) / 100;
  };

  const renderTally = (i, field, player = null) => (
    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', alignItems: 'center' }}>
      <button
        type="button"
        onClick={() => handleChange(i, field, Math.max(0, Number((player ? stats[i][player]?.[field] : stats[i][field]) || 0) - 1), player)}
        style={{
          width: '28px',
          height: '28px',
          fontSize: '11px',
          backgroundColor: '#943126',
          color: '#ecf0f1',
          border: 'none',
          borderRadius: '4px',
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
        fontSize: '14px',
        color: '#ecf0f1'
      }}>
        {player ? stats[i][player]?.[field] || 0 : stats[i][field]}
      </span>
      <button
        type="button"
        onClick={() => handleChange(i, field, Number((player ? stats[i][player]?.[field] : stats[i][field]) || 0) + 1, player)}
        style={{
          width: '28px',
          height: '28px',
          fontSize: '14px',
          backgroundColor: '#1e8449',
          color: '#ecf0f1',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        +
      </button>
    </div>
  );

  const renderTextInput = (i, field, player = null) => (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <input
        type="text"
        value={player ? stats[i][player]?.[field] || '' : stats[i][field]}
        onChange={e => handleChange(i, field, e.target.value, player)}
        style={{
          maxWidth: '70px',
          textAlign: 'center',
          padding: '4px',
          border: '1px solid #7f8c8d',
          borderRadius: '4px',
          fontSize: '12px',
          backgroundColor: '#2c3e50',
          color: '#ecf0f1',
          width: '100%' // keep this so the input doesn't collapse
        }}
        placeholder={field === 'tens' ? '9,8,4' : ''}
      />
    </div>
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
      const matchStatsEntries = [];
      const fineEntries = [];

      stats.forEach((entry, legIndex) => {
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
            is_double: legIndex >= 5
          };
          matchStatsEntries.push(player1Stats);

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

        if (entry.player2_id && legIndex >= 5) {
          const player2Stats = {
            match_id: matchId,
            player_id: entry.player2_id,
            win: 0,
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

      const { error: statsError } = await supabase
        .from('match_stats')
        .insert(matchStatsEntries);

      if (statsError) {
        throw new Error('Failed to save match stats: ' + statsError.message);
      }

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
        padding: '20px',
        backgroundColor: '#2c3e50',
        color: '#ecf0f1'
      }}>
        <h2>Loading...</h2>
        <p>Fetching players from database...</p>
      </div>
    );
  }

  return (
    <div style={{
      padding: '15px',
      backgroundColor: '#2c3e50',
      minHeight: '100vh',
      color: '#ecf0f1'
    }}>
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
          }
        `}
      </style>

      {/* Header */}
      <div style={{ marginBottom: '25px', position: 'relative', paddingTop: '50px' }}>
        {/* Match ID in top left - smaller and more subtle */}
        <div style={{
          position: 'absolute',
          top: '0px',
          left: '0px',
          backgroundColor: '#34495e',
          padding: '4px 8px',
          borderRadius: '4px',
          border: '1px solid #943126'
        }}>
          <p style={{ color: '#1C1818', fontSize: '11px', margin: '0', fontWeight: 'normal' }}>
            ID: {matchId}
          </p>
        </div>

        {/* Centered title */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            backgroundColor: '#943126',
            padding: '15px 25px',
            borderRadius: '10px',
            marginBottom: '15px',
            border: '2px solid #ecf0f1',
            display: 'inline-block'
          }}>
            <h2 style={{ color: '#bdc3c7', margin: '0', fontWeight: 'bold' }}>Match Stats Entry</h2>
          </div>
        </div>
      </div>

      {/* Duplicate Warning Modal */}
      {showDuplicateWarning && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#34495e',
            padding: '20px',
            borderRadius: '10px',
            maxWidth: '400px',
            margin: '20px',
            border: '2px solid #c0392b'
          }}>
            <h3 style={{ color: '#943126', marginBottom: '15px' }}>⚠️ Duplicate Player Warning</h3>
            <p style={{ marginBottom: '20px', color: '#BDC3C7' }}>
              You have the same player selected for multiple singles matches. Continue anyway?
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDuplicateWarning(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#7f8c8d',
                  color: '#BDC3C7',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#943126',
                  color: '#BDC3C7',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {message && (
        <div style={{
          color: message.includes('Error') ? '#BDC3C7' : '#2c3e50',
          padding: '12px',
          backgroundColor: message.includes('Error') ? '#943126' : '#1e8449',
          borderRadius: '8px',
          border: '2px solid #ecf0f1',
          marginBottom: '20px',
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          {message}
        </div>
      )}

      {players.length === 0 && !loading && (
        <div style={{
          color: '#2c3e50',
          padding: '12px',
          backgroundColor: '#f39c12',
          borderRadius: '8px',
          border: '2px solid #ecf0f1',
          marginBottom: '20px',
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          No players found in database.
        </div>
      )}

      {/* Fine Rates */}
      <div style={{
        backgroundColor: '#34495e',
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '20px',
        fontSize: '14px',
        textAlign: 'center',
        border: '1px solid #c0392b'
      }}>
        <strong style={{ color: '#BDC3C7' }}>Fine Rates:</strong>
      </div>

      <div style={{
        backgroundColor: '#34495e',
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '20px',
        fontSize: '14px',
        textAlign: 'center',
        border: '1px solid #c0392b'
      }}>
        <span style={{ color: '#BDC3C7' }}> 26s: £0.26 | Misses: £0.50 | DOTD: £2.50 | Tens: score in pence</span>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          borderCollapse: 'collapse',
          width: '100%',
          minWidth: '800px',
          backgroundColor: '#34495e',
          borderRadius: '10px',
          overflow: 'hidden',
          border: '2px solid #c0392b',
          fontSize: '11px'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#2c3e50', color: '#BDC3C7', fontSize: '11px' }}>
              <th style={{ padding: '3px', textAlign: 'center', border: '1px solid #7f8c8d' }}>Leg</th>
              <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #7f8c8d'}}>Player</th>
              <th style={{ padding: '3px', textAlign: 'center', border: '1px solid #7f8c8d' }}>Win</th>
              <th style={{ padding: '3px', textAlign: 'center', border: '1px solid #7f8c8d' }}>Loss</th>
              <th style={{ padding: '3px', textAlign: 'center', border: '1px solid #7f8c8d' }}>100+</th>
              <th style={{ padding: '3px', textAlign: 'center', border: '1px solid #7f8c8d' }}>140+</th>
              <th style={{ padding: '3px', textAlign: 'center', border: '1px solid #7f8c8d' }}>180</th>
              <th style={{ padding: '3px', textAlign: 'center', border: '1px solid #7f8c8d' }}>Checkout</th>
              <th style={{ padding: '3px', textAlign: 'center', border: '1px solid #7f8c8d' }}>26s</th>
              <th style={{ padding: '3px', textAlign: 'center', border: '1px solid #7f8c8d' }}>Tens</th>
              <th style={{ padding: '3px', textAlign: 'center', border: '1px solid #7f8c8d' }}>Miss</th>
              <th style={{ padding: '3px', textAlign: 'center', border: '1px solid #7f8c8d' }}>DOTD</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((row, i) => (
              <React.Fragment key={i}>
                <tr style={{
                  backgroundColor: i >= 5 ? '#445669' : '#34495e',
                  color: '#BDC3C7'
                }}>
                  <td rowSpan={i >= 5 ? 2 : 1} style={{
                    textAlign: 'center',
                    fontWeight: 'bold',
                    backgroundColor: i >= 5 ? '#943126' : '#2c3e50',
                    color: '#BDC3C7',
                    padding: '3px',
                    border: '1px solid #7f8c8d'
                  }}>
                    {i + 1}
                    {i >= 5 && <><br /><small>Doubles</small></>}
                  </td>
                  <td style={{ padding: '6px', border: '1px solid #7f8c8d', width: getPlayerColumnWidth(), minWidth:getPlayerColumnWidth() }}>
                    <select
                      value={row.player1_id}
                      onChange={e => handleChange(i, 'player1_id', e.target.value)}
                      style={{
                        minWidth: getPlayerColumnWidth(),
                        padding: '4px',
                        borderRadius: '4px',
                        border: '1px solid #c0392b',
                        fontSize: '13px',
                        backgroundColor: '#2c3e50',
                        color: '#BDC3C7',
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
                  <td className={i >= 5 ? "no-bottom-border" : ""} rowSpan={i >= 5 ? 2 : 1} style={{ padding: '6px', fontSize: '11px', border: '1px solid #7f8c8d' }}>
                    {renderTally(i, 'win')}
                  </td>
                  <td className={i >= 5 ? "no-bottom-border" : ""} rowSpan={i >= 5 ? 2 : 1} style={{ padding: '6px', fontSize: '11px', border: '1px solid #7f8c8d' }}>
                    {renderTally(i, 'loss')}
                  </td>
                  <td style={{ padding: '6px', fontSize: '11px', border: '1px solid #7f8c8d' }}>{renderTally(i, 'score_100')}</td>
                  <td style={{ padding: '6px', fontSize: '11px', border: '1px solid #7f8c8d' }}>{renderTally(i, 'score_140')}</td>
                  <td style={{ padding: '6px', fontSize: '11px', border: '1px solid #7f8c8d' }}>{renderTally(i, 'score_180')}</td>
                  <td style={{ padding: '6px', fontSize: '11px', border: '1px solid #7f8c8d' }}>{renderTextInput(i, 'highest_checkout')}</td>
                  <td style={{ padding: '6px', fontSize: '11px', border: '1px solid #7f8c8d' }}>{renderTally(i, 'score_26')}</td>
                  <td style={{ padding: '6px', fontSize: '11px', border: '1px solid #7f8c8d' }}>{renderTextInput(i, 'tens')}</td>
                  <td style={{ padding: '6px', fontSize: '11px', border: '1px solid #7f8c8d' }}>{renderTally(i, 'miss')}</td>
                  <td style={{ padding: '6px', fontSize: '11px', border: '1px solid #7f8c8d' }}>{renderTally(i, 'dotd')}</td>
                </tr>

                {i >= 5 && (
                  <tr style={{
                    backgroundColor: '#445669',
                    color: '#BDC3C7'
                  }}>
                    <td style={{ padding: '6px', border: '1px solid #7f8c8d', width: getPlayerColumnWidth(), minWidth:getPlayerColumnWidth() }}>
                      <select
                        value={row.player2_id}
                        onChange={e => handleChange(i, 'player2_id', e.target.value)}
                        style={{
                          minWidth: getPlayerColumnWidth(),
                          padding: '4px',
                          borderRadius: '4px',
                          border: '1px solid #c0392b',
                          fontSize: '13px',
                          backgroundColor: '#2c3e50',
                          color: '#BDC3C7'
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
                    <td style={{ padding: '6px', fontSize: '11px', border: '1px solid #7f8c8d' }}>{renderTally(i, 'score_100', 'player2')}</td>
                    <td style={{ padding: '6px', fontSize: '11px', border: '1px solid #7f8c8d' }}>{renderTally(i, 'score_140', 'player2')}</td>
                    <td style={{ padding: '6px', fontSize: '11px', border: '1px solid #7f8c8d' }}>{renderTally(i, 'score_180', 'player2')}</td>
                    <td style={{ padding: '6px', fontSize: '11px', border: '1px solid #7f8c8d' }}>{renderTextInput(i, 'highest_checkout', 'player2')}</td>
                    <td style={{ padding: '6px', fontSize: '11px', border: '1px solid #7f8c8d' }}>{renderTally(i, 'score_26', 'player2')}</td>
                    <td style={{ padding: '6px', fontSize: '11px', border: '1px solid #7f8c8d' }}>{renderTextInput(i, 'tens', 'player2')}</td>
                    <td style={{ padding: '6px', fontSize: '11px', border: '1px solid #7f8c8d' }}>{renderTally(i, 'miss', 'player2')}</td>
                    <td style={{ padding: '6px', fontSize: '11px', border: '1px solid #7f8c8d' }}>{renderTally(i, 'dotd', 'player2')}</td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Submit Button */}
      <div style={{ textAlign: 'center', marginTop: '25px' }}>
        <button
          onClick={handleSubmitAttempt}
          disabled={submitting}
          style={{
            padding: '14px 28px',
            fontSize: '16px',
            backgroundColor: submitting ? '#7f8c8d' : '#34495e',
            color: '#BDC3C7',
            border: '2px solid #c0392b',
            borderRadius: '10px',
            cursor: submitting ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            if (!submitting) {
              e.target.style.backgroundColor = '#943126';
            }
          }}
          onMouseOut={(e) => {
            if (!submitting) {
              e.target.style.backgroundColor = '#34495e';
            }
          }}
        >
          {submitting ? 'Saving...' : 'Submit All Stats & Calculate Fines'}
        </button>
      </div>
    </div>
  );
}