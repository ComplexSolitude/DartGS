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
      backgroundColor: '#1a1a1a'
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '40px'
      }}>
        <div style={{
          backgroundColor: '#dc3545',
          padding: '20px 40px',
          borderRadius: '15px',
          marginBottom: '30px',
          boxShadow: '0 8px 25px rgba(220, 53, 69, 0.3)',
          border: '2px solid #000'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            margin: '0',
            color: '#000',
            fontWeight: 'bold',
            textShadow: '2px 2px 4px rgba(255,255,255,0.1)'
          }}>
            Darts Match Tracker
          </h1>
        </div>

        <button
          onClick={handleCreateMatch}
          disabled={loading}
          style={{
            padding: '16px 32px',
            fontSize: '18px',
            backgroundColor: loading ? '#666' : '#000',
            color: loading ? '#999' : '#dc3545',
            border: '2px solid #dc3545',
            borderRadius: '12px',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 15px rgba(220, 53, 69, 0.3)',
            transition: 'all 0.3s ease',
            fontWeight: 'bold'
          }}
          onMouseOver={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = '#dc3545';
              e.target.style.color = '#000';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(220, 53, 69, 0.5)';
            }
          }}
          onMouseOut={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = '#000';
              e.target.style.color = '#dc3545';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(220, 53, 69, 0.3)';
            }
          }}
        >
          {loading ? 'Creating Match...' : 'Create New Match'}
        </button>
      </div>
    </div>
  );
}