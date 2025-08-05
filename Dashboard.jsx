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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      backgroundColor: '#f8f9fa'
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '40px'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          marginBottom: '20px',
          color: '#2c3e50',
          fontWeight: 'bold'
        }}>
          Darts Match Tracker
        </h1>

        <button
          onClick={handleCreateMatch}
          disabled={loading}
          style={{
            padding: '16px 32px',
            fontSize: '18px',
            backgroundColor: loading ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease',
            fontWeight: 'bold'
          }}
          onMouseOver={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = '#218838';
              e.target.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseOut={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = '#28a745';
              e.target.style.transform = 'translateY(0)';
            }
          }}
        >
          {loading ? 'Creating Match...' : 'Create New Match'}
        </button>
      </div>
    </div>
  );
}