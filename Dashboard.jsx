// Dashboard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();

function doPost(e) {
  const path = e.parameter.path;

  try {
    const ss = SpreadsheetApp.openById("17m2K1PAXxaKK4A66mcyW-FURwEcYa4hFM7pcfl6EypY");

    if (path === "createMatch") {
      const body = JSON.parse(e.postData.contents);
      const matchId = body.match_id;
      if (!matchId) throw new Error("No match_id provided");

      const template = ss.getSheetByName("MatchTemplate");
      if (!template) throw new Error("No sheet named 'MatchTemplate' found");

      if (ss.getSheetByName(matchId)) {
        return ContentService.createTextOutput(JSON.stringify({ status: 200, message: "Sheet already exists" }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      template.copyTo(ss).setName(matchId);

      return ContentService.createTextOutput(JSON.stringify({ status: 200, message: "Sheet created" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Fallback
    return ContentService.createTextOutput(JSON.stringify({ status: 400, message: "Invalid path" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 500, message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

  return (
    <div style={{ padding: 20 }}>
      <h1>Dashboard</h1>
      <button onClick={handleCreateMatch}>Create New Match</button>
    </div>
  );
}