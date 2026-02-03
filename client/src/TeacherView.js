import React, { useState, useEffect } from "react";
import axios from "axios";

function TeacherView({ onLogout }) {
  const [submissions, setSubmissions] = useState([]);
  const [grades, setGrades] = useState({}); // To store input values temporarily

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const res = await axios.get("http://localhost:5000/submissions");
      setSubmissions(res.data);
    } catch (err) {
      console.error("Failed to fetch submissions");
    }
  };

  const handleGradeChange = (id, value) => {
    setGrades({ ...grades, [id]: value });
  };

  const submitGrade = async (id) => {
    const gradeValue = grades[id];
    if (!gradeValue) return alert("Please enter a mark first.");

    try {
      await axios.post("http://localhost:5000/grade", { id, grade: gradeValue });
      alert("Grade Saved!");
      fetchSubmissions(); // Refresh to show the locked grade
    } catch (err) {
      alert("Error saving grade");
    }
  };

  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <header className="main-header">
        <div className="brand">
          <h2>CodeInsight</h2>
          <span>Teacher Dashboard</span>
        </div>
        <div className="header-actions">
           <button onClick={fetchSubmissions} className="btn-submit">Refresh List</button>
           <button onClick={onLogout} className="btn-logout">Logout</button>
        </div>
      </header>

      {/* CONTENT AREA */}
      <div className="analysis-content" style={{ padding: "40px", maxWidth: "1000px", margin: "0 auto" }}>
        <h3 style={{ color: "#c9d1d9", marginBottom: "20px" }}>
            Student Submissions ({submissions.length})
        </h3>

        {submissions.length === 0 ? (
            <div className="empty-state">No assignments submitted yet.</div>
        ) : (
            submissions.map((sub) => (
                <div key={sub.id} className="result-card" style={{ marginBottom: "20px" }}>
                    {/* Student Info */}
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", borderBottom: "1px solid #30363d", paddingBottom: "10px" }}>
                        <div>
                            <h4 style={{ color: "#58a6ff", margin: 0, fontSize: "18px" }}>{sub.studentName}</h4>
                            <span style={{ fontSize: "12px", color: "#8b949e" }}>Submitted at: {sub.timestamp}</span>
                        </div>
                        <div style={{ textAlign: "right" }}>
                             <span className="line-badge" style={{ background: sub.plagiarismScore > 50 ? "#da3633" : "#238636", marginRight: "10px" }}>
                                Plagiarism: {sub.plagiarismScore}%
                             </span>
                        </div>
                    </div>
                    
                    {/* The Code Block */}
                    <div style={{ background: "#0d1117", padding: "15px", borderRadius: "6px", border: "1px solid #30363d", fontFamily: "Fira Code", fontSize: "13px", color: "#c9d1d9", whiteSpace: "pre-wrap", marginBottom: "15px" }}>
                        {sub.code}
                    </div>

                    {/* Grading Section */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "flex-end" }}>
                        {sub.grade ? (
                            <span style={{ color: "#3fb950", fontWeight: "bold", fontSize: "16px" }}>
                                ✅ Graded: {sub.grade}/100
                            </span>
                        ) : (
                            <>
                                <input 
                                    type="number" 
                                    placeholder="Marks (0-100)" 
                                    style={{ padding: "8px", borderRadius: "5px", border: "1px solid #30363d", background: "#0d1117", color: "white", width: "120px" }}
                                    onChange={(e) => handleGradeChange(sub.id, e.target.value)}
                                />
                                <button 
                                    onClick={() => submitGrade(sub.id)}
                                    style={{ padding: "8px 15px", background: "#1f6feb", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
                                >
                                    Save Grade
                                </button>
                            </>
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