// Dashboard.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleCreateMatch = async () => {
    setLoading(true);

    try {
      // Create a new match in Supabase
      const { data: match, error } = await supabase
        .from('matches')
        .insert([
          {
            title: `Match ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
          }
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log('Match created:', match);
      navigate(`/match/${match.id}`);

    } catch (err) {
      console.error('Error creating match:', err);
      alert("Failed to create match: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Darts Match Tracker</h1>
      <p>Track your match stats and calculate fines automatically</p>
      <button
        onClick={handleCreateMatch}
        disabled={loading}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Creating Match...' : 'Create New Match'}
      </button>
    </div>
  );
}