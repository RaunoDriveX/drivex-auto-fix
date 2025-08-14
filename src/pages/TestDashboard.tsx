import React from 'react';

const TestDashboard = () => {
  console.log('🔥 TEST DASHBOARD LOADING!');
  
  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-4xl font-bold text-primary mb-4">🔥 TEST DASHBOARD</h1>
      <p className="text-xl">If you can see this, the routing works!</p>
      <div className="mt-4 p-4 bg-card rounded-lg">
        <p>Current URL: {window.location.href}</p>
        <p>Timestamp: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};

export default TestDashboard;