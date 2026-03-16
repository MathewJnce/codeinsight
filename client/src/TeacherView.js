import React, { useState, useEffect } from "react";
import axios from "axios";

function TeacherView({ onLogout }) {
  const [submissions, setSubmissions] = useState([]);
  const [searchEmail, setSearchEmail] = useState(""); // Search filter state

  // Fetch data immediately when the dashboard loads
  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const res = await axios.get("http://localhost:5000/submissions");
      setSubmissions(res.data);
    } catch (err) {
      console.error("Failed to fetch submissions. Is the server running?");
    }
  };

  const submitGrade = async (id, value) => {
    if (!value) return alert("Please enter a mark first.");
    
    try {
      await axios.post("http://localhost:5000/grade", { id, grade: value });
      alert("✅ Grade Saved Successfully!");
      fetchSubmissions(); // Refresh to show the locked grade
    } catch (err) {
      alert("Error saving grade");
    }
  };

  // --- ANALYTICS CALCULATIONS (The "Wow" Factor) ---
  const totalStudents = submissions.length;
  const gradedStudents = submissions.filter(s => s.grade !== null);
  
  // Calculate Class Average
  const avgGrade = gradedStudents.length > 0 
      ? Math.round(gradedStudents.reduce((acc, curr) => acc + parseInt(curr.grade), 0) / gradedStudents.length)
      : 0;
  
  // Calculate Pass vs Fail (Assume pass mark is 50)
  const passCount = gradedStudents.filter(s => parseInt(s.grade) >= 50).length;
  const failCount = gradedStudents.filter(s => parseInt(s.grade) < 50).length;
  
  // Calculate width for the progress bar
  const passPercent = gradedStudents.length > 0 ? (passCount / gradedStudents.length) * 100 : 0;

  // Filter the list based on search input
  const filteredList = submissions.filter(sub => 
    (sub.email && sub.email.toLowerCase().includes(searchEmail.toLowerCase())) || 
    (sub.studentName && sub.studentName.toLowerCase().includes(searchEmail.toLowerCase()))
  );

  return (
    <div className="dashboard-container">
      {/* --- HEADER --- */}
      <header className="main-header">
        <div className="brand">
          <h2>CodeInsight</h2>
          <span>Teacher Dashboard</span>
        </div>
        <div className="header-actions">
           <button onClick={fetchSubmissions} className="btn-submit" style={{background: "#21262d", marginRight: "10px"}}>Refresh Data</button>
           <button onClick={onLogout} className="btn-logout">Logout</button>
        </div>
      </header>

      <div className="analysis-content" style={{ padding: "40px", maxWidth: "1000px", margin: "0 auto" }}>
        
        {/* --- 1. ANALYTICS DASHBOARD SECTION --- */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "30px" }}>
            {/* Card A: Class Average */}
            <div className="result-card" style={{ textAlign: "center", padding: "20px" }}>
                <h4 style={{ margin: "0 0 10px 0", color: "#8b949e", fontSize: "12px", textTransform: "uppercase" }}>Class Average</h4>
                <div style={{ fontSize: "36px", fontWeight: "bold", color: "#58a6ff" }}>
                    {avgGrade}%
                </div>
                <div style={{ fontSize: "11px", color: "#8b949e", marginTop: "5px" }}>Based on {gradedStudents.length} graded tasks</div>
            </div>

            {/* Card B: Total Submissions */}
            <div className="result-card" style={{ textAlign: "center", padding: "20px" }}>
                <h4 style={{ margin: "0 0 10px 0", color: "#8b949e", fontSize: "12px", textTransform: "uppercase" }}>Total Submissions</h4>
                <div style={{ fontSize: "36px", fontWeight: "bold", color: "#c9d1d9" }}>
                    {totalStudents}
                </div>
                <div style={{ fontSize: "11px", color: "#8b949e", marginTop: "5px" }}>Active Students</div>
            </div>

            {/* Card C: Pass/Fail Ratio */}
            <div className="result-card" style={{ padding: "20px" }}>
                <h4 style={{ margin: "0 0 15px 0", color: "#8b949e", fontSize: "12px", textTransform: "uppercase", textAlign: "center" }}>Pass / Fail Ratio</h4>
                
                {/* Visual Bar Chart */}
                <div style={{ height: "15px", background: "#30363d", borderRadius: "10px", overflow: "hidden", display: "flex", marginBottom: "10px" }}>
                    <div style={{ width: `${passPercent}%`, background: "#3fb950", transition: "width 0.5s" }}></div>
                    <div style={{ width: `${100 - passPercent}%`, background: "#da3633", transition: "width 0.5s" }}></div>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#c9d1d9" }}>
                    <span style={{ color: "#3fb950" }}>Passed: {passCount}</span>
                    <span style={{ color: "#da3633" }}>Failed: {failCount}</span>
                </div>
            </div>
        </div>

        {/* --- 2. SEARCH BAR --- */}
        <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
            <input 
                type="text" 
                placeholder="🔍 Search by Student Name or Email..." 
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                style={{ flex: 1, padding: "12px", borderRadius: "6px", border: "1px solid #30363d", background: "#0d1117", color: "white", fontSize: "14px" }}
            />
        </div>

        {/* --- 3. STUDENT LIST --- */}
        <h3 style={{ color: "#c9d1d9", marginBottom: "20px", borderBottom: "1px solid #30363d", paddingBottom: "10px" }}>
            Student Submissions ({filteredList.length})
        </h3>

        {filteredList.length === 0 ? (
            <div className="empty-state">No students found. Waiting for submissions...</div>
        ) : (
            filteredList.map((sub) => (
                <div key={sub.id} className="result-card" style={{ marginBottom: "20px", borderLeft: sub.grade ? "4px solid #3fb950" : "4px solid #8b949e" }}>
                    
                    {/* Student Info Row */}
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", paddingBottom: "10px", borderBottom: "1px solid #21262d" }}>
                        <div>
                            <h4 style={{ color: "#58a6ff", margin: 0, fontSize: "18px" }}>{sub.studentName}</h4>
                            <div style={{ fontSize: "12px", color: "#8b949e", marginTop: "4px" }}>
                                📧 {sub.email || "No email provided"}  •  🕒 {sub.timestamp}
                            </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                             <span className="line-badge" style={{ background: sub.plagiarismScore > 50 ? "#da3633" : "#238636", fontSize: "12px" }}>
                                Plagiarism: {sub.plagiarismScore}%
                             </span>
                        </div>
                    </div>
                    
                    {/* The Code Block */}
                    <div style={{ background: "#0d1117", padding: "15px", borderRadius: "6px", border: "1px solid #30363d", fontFamily: "Fira Code", fontSize: "13px", color: "#c9d1d9", whiteSpace: "pre-wrap", marginBottom: "15px", maxHeight: "200px", overflow: "auto" }}>
                        {sub.code}
                    </div>

                    {/* Grading Section */}
                    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "15px" }}>
                        {sub.grade ? (
                            <div style={{ textAlign: "right" }}>
                                <span style={{ display: "block", fontSize: "11px", color: "#8b949e", textTransform: "uppercase" }}>Final Grade</span>
                                <span style={{ color: "#3fb950", fontWeight: "bold", fontSize: "20px" }}>{sub.grade}/100</span>
                            </div>
                        ) : (
                            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                <input 
                                    type="number" 
                                    placeholder="Marks (0-100)" 
                                    id={`grade-${sub.id}`} 
                                    style={{ padding: "8px", borderRadius: "5px", background: "#0d1117", color: "white", width: "100px", border: "1px solid #30363d" }} 
                                />
                                <button 
                                    onClick={() => submitGrade(sub.id, document.getElementById(`grade-${sub.id}`).value)} 
                                    style={{ padding: "8px 20px", background: "#1f6feb", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "600" }}
                                >
                                    Save Grade
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
}

export default TeacherView;