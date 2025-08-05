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
      justifyContent: 'flex-start',
      padding: '100px',
      backgroundColor: '#2c3e50'
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '40px'
      }}>
        <div style={{
          backgroundColor: '#943126',
          padding: '20px 40px',
          borderRadius: '15px',
          marginBottom: '30px',
          boxShadow: '0 8px 25px rgba(192, 57, 43, 0.3)',
          border: '3px solid #ecf0f1'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            margin: '0',
            color: '#BDC3C7',
            fontWeight: 'bold',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>
            Burnaby Darts Team
          </h1>
        </div>

        <button
          onClick={handleCreateMatch}
          disabled={loading}
          style={{
            padding: '16px 32px',
            fontSize: '18px',
            backgroundColor: loading ? '#7f8c8d' : '#34495e',
            color: loading ? '#bdc3c7' : '#ecf0f1',
            border: '2px solid #c0392b',
            borderRadius: '12px',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 15px rgba(192, 57, 43, 0.2)',
            transition: 'all 0.3s ease',
            fontWeight: 'bold'
          }}
          onMouseOver={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = '#943126';
              e.target.style.color = '#BDC3C7';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(192, 57, 43, 0.4)';
            }
          }}
          onMouseOut={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = '#34495e';
              e.target.style.color = '#BDC3C7';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(192, 57, 43, 0.2)';
            }
          }}
        >
          {loading ? 'Creating Match...' : 'Create New Match'}
        </button>
      </div>
    </div>
  );
}