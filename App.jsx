import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import MatchStatsWrapper from './MatchStatsWrapper'; // Make sure this exists!

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/match/:id" element={<MatchStatsWrapper />} />
      </Routes>
    </Router>
  );
}

