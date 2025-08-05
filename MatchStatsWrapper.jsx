import React from 'react';
import { useParams } from 'react-router-dom';
import MatchStatsForm from './MatchStatsForm';

export default function MatchStatsWrapper() {
  const { id } = useParams();

  return <MatchStatsForm matchId={id} />;
}