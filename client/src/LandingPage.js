import React from 'react';

function LandingPage({ userType, onNavigate, onLogout }) {
  return (
    <div style={{ height: "100vh", background: "#0d1117", color: "white", display: "flex", flexDirection: "column" }}>
      {/* Navbar */}
      <nav style={{ padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #30363d" }}>
        <h2 style={{ margin: 0, fontSize: "24px" }}>CodeInsight <span style={{ color: "#8b949e", fontSize: "14px" }}>Dashboard</span></h2>
        <button onClick={onLogout} style={{ padding: "8px 20px", background: "transparent", border: "1px solid #30363d", color: "#c9d1d9", borderRadius: "6px", cursor: "pointer" }}>Logout</button>
      </nav>

      {/* Hero Section */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "40px" }}>
        <h1 style={{ fontSize: "48px", textAlign: "center", maxWidth: "800px" }}>
          Welcome back, <span style={{ color: "#58a6ff" }}>{userType}</span>.
        </h1>
        <p style={{ color: "#8b949e", fontSize: "18px", marginTop: "-20px" }}>What would you like to do today?</p>

        {/* Action Cards */}
        <div style={{ display: "flex", gap: "30px" }}>
          
          {/* Card 1: Main Action */}
          <div onClick={() => onNavigate(userType === 'Student' ? 'student-view' : 'teacher-view')} 
               style={{ width: "250px", padding: "30px", background: "#161b22", border: "1px solid #30363d", borderRadius: "12px", cursor: "pointer", transition: "0.2s", textAlign: "center" }}
               onMouseOver={e => e.currentTarget.style.borderColor = "#58a6ff"}
               onMouseOut={e => e.currentTarget.style.borderColor = "#30363d"}>
             <div style={{ fontSize: "40px", marginBottom: "20px" }}>🚀</div>
             <h3 style={{ margin: "0 0 10px 0" }}>{userType === 'Student' ? 'Start Coding' : 'Grade Submissions'}</h3>
             <p style={{ color: "#8b949e", fontSize: "14px" }}>Go to your main workspace.</p>
          </div>

          {/* Card 2: View Analytics (NOW ACTIVE!) */}
          <div onClick={() => onNavigate('analytics-view')} 
               style={{ width: "250px", padding: "30px", background: "#161b22", border: "1px solid #30363d", borderRadius: "12px", cursor: "pointer", transition: "0.2s", textAlign: "center" }}
               onMouseOver={e => e.currentTarget.style.borderColor = "#a371f7"}
               onMouseOut={e => e.currentTarget.style.borderColor = "#30363d"}>
             <div style={{ fontSize: "40px", marginBottom: "20px" }}>📊</div>
             <h3 style={{ margin: "0 0 10px 0" }}>View Analytics</h3>
             <p style={{ color: "#8b949e", fontSize: "14px" }}>Detailed performance charts.</p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default LandingPage;