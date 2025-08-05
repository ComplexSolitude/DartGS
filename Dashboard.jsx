import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();

  const handleCreateMatch = async () => {
    const newMatchId = `match_${Date.now()}`;

    try {
      const response = await fetch('./api/createMatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json' // Fixed: should be application/json, not text/plain
        },
        body: JSON.stringify({ match_id: newMatchId })
      });

      const result = await response.text();
      console.log('Create match response:', result); // Add logging for debugging
      
      if (response.ok) {
        navigate(`/match/${newMatchId}`);
      } else {
        alert("Failed to create match: " + result);
      }
    } catch (err) {
      console.error('Error creating match:', err);
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