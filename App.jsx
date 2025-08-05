import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import MatchStatsWrapper from './MatchStatsWrapper';

export default function App() {
  return (
    <Router>
        {/*<header style={{*/}
        {/*    display: 'flex',*/}
        {/*    justifyContent: 'center',*/}
        {/*    alignItems: 'center',*/}
        {/*    padding: '1rem',*/}
        {/*    backgroundColor: '#222'*/}
        {/*}}>*/}
        {/*    <img*/}
        {/*      src="/Arms.jpg"*/}
        {/*      alt="Logo"*/}
        {/*      style={{ maxHeight: '60px' }}*/}
        {/*    />*/}
        {/*</header>*/}
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/match/:id" element={<MatchStatsWrapper />} />
      </Routes>
    </Router>
  );
}

