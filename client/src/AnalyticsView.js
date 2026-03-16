import React, { useState, useEffect } from "react";
import axios from "axios";

function AnalyticsView({ onBack, userRole }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get("http://localhost:5000/submissions");
      setSubmissions(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch analytics", err);
      setLoading(false);
    }
  };

  // --- CALCULATE STATISTICS ---
  const totalSubmissions = submissions.length;
  
  const gradedSubmissions = submissions.filter(s => s.grade !== null);
  const avgGrade = gradedSubmissions.length > 0 
    ? Math.round(gradedSubmissions.reduce((sum, s) => sum + Number(s.grade), 0) / gradedSubmissions.length) 
    : 0;

  const avgPlagiarism = totalSubmissions > 0
    ? Math.round(submissions.reduce((sum, s) => sum + Number(s.plagiarismScore || 0), 0) / totalSubmissions)
    : 0;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.brandGroup}>
          <h2 style={styles.logo}>CodeInsight <span style={styles.logoAccent}>Analytics</span></h2>
        </div>
        <button onClick={onBack} style={styles.secondaryBtn}>← Back to Dashboard</button>
      </header>

      <main style={styles.main}>
        <h1 style={styles.pageTitle}>System Analytics Overview</h1>
        <p style={styles.subtitle}>Viewing data as: <strong>{userRole}</strong></p>

        {loading ? (
          <p style={{ color: "#8b949e" }}>Loading system data...</p>
        ) : (
          <>
            {/* STATS GRID */}
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <span style={styles.cardLabel}>TOTAL SUBMISSIONS</span>
                <span style={styles.cardValue}>{totalSubmissions}</span>
              </div>
              <div style={styles.statCard}>
                <span style={styles.cardLabel}>AVERAGE GRADE</span>
                <span style={{...styles.cardValue, color: "#58a6ff"}}>{avgGrade}%</span>
              </div>
              <div style={{...styles.statCard, borderLeft: avgPlagiarism > 20 ? "3px solid #f85149" : "3px solid #3fb950"}}>
                <span style={styles.cardLabel}>AVG PLAGIARISM</span>
                <span style={{...styles.cardValue, color: avgPlagiarism > 20 ? "#f85149" : "#3fb950"}}>{avgPlagiarism}%</span>
              </div>
            </div>

            {/* RECENT ACTIVITY */}
            <div style={styles.tableContainer}>
              <div style={styles.tableHeader}>RECENT ACTIVITY LOG</div>
              {submissions.length === 0 ? (
                <p style={styles.emptyText}>No data available yet.</p>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tr}>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Student</th>
                      <th style={styles.th}>Plagiarism</th>
                      <th style={styles.th}>Grade</th>
                      <th style={styles.th}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...submissions].reverse().slice(0, 10).map((sub) => (
                      <tr key={sub.id} style={styles.tr}>
                        <td style={styles.td}>#{sub.id}</td>
                        <td style={styles.td}>{sub.studentName}</td>
                        <td style={{...styles.td, color: sub.plagiarismScore > 20 ? "#f85149" : "#3fb950"}}>
                          {sub.plagiarismScore}%
                        </td>
                        <td style={styles.td}>{sub.grade !== null ? `${sub.grade}%` : "Pending"}</td>
                        <td style={styles.td}>{sub.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", background: "#0d1117", color: "#c9d1d9", fontFamily: "'Inter', sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 24px", height: "64px", background: "#161b22", borderBottom: "1px solid #30363d" },
  brandGroup: { display: "flex", alignItems: "center" },
  logo: { margin: 0, fontSize: "20px", fontWeight: "700" },
  logoAccent: { color: "#a371f7", fontWeight: "400", fontSize: "14px", marginLeft: "5px" },
  secondaryBtn: { background: "transparent", color: "#8b949e", border: "1px solid #30363d", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "13px" },
  main: { padding: "40px", maxWidth: "1000px", margin: "0 auto" },
  pageTitle: { margin: "0 0 10px 0", fontSize: "28px" },
  subtitle: { color: "#8b949e", marginBottom: "40px" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "40px" },
  statCard: { background: "#161b22", padding: "24px", borderRadius: "8px", border: "1px solid #30363d", display: "flex", flexDirection: "column" },
  cardLabel: { fontSize: "12px", fontWeight: "700", color: "#8b949e", marginBottom: "10px" },
  cardValue: { fontSize: "36px", fontWeight: "700", color: "#e6edf3" },
  tableContainer: { background: "#161b22", borderRadius: "8px", border: "1px solid #30363d", overflow: "hidden" },
  tableHeader: { padding: "15px 20px", background: "#0d1117", borderBottom: "1px solid #30363d", fontSize: "12px", fontWeight: "700", color: "#8b949e" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "12px 20px", borderBottom: "1px solid #30363d", color: "#8b949e", fontSize: "12px" },
  td: { padding: "12px 20px", borderBottom: "1px solid #30363d", fontSize: "14px" },
  tr: { background: "#161b22" },
  emptyText: { padding: "20px", color: "#8b949e", fontStyle: "italic" }
};

export default AnalyticsView;