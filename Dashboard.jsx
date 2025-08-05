// Dashboard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();

  const handleCreateMatch = async () => {
    const newMatchId = `match_${Date.now()}`;

    try {
      await fetch('./api/createMatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ match_id: newMatchId })
      });

      navigate(`/match/${newMatchId}`);
    } catch (err) {
      alert("Failed to create match: " + err.message);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Dashboard</h1>
      <button onClick={handleCreateMatch}>Create New Match</button>
    </div>
  );
}
