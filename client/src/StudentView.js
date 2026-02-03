import React, { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";

function StudentView({ onLogout }) {
  // Default starter code
  const [code, setCode] = useState(`// Write your C code here...

#include <stdio.h>

int main() {
    int number = 10
    
    printf("Hello World");
    return 0;
}`);

  const [analyzing, setAnalyzing] = useState(false);
  const [statusText, setStatusText] = useState("Ready");
  const [plagiarismData, setPlagData] = useState(null);
  const [errorList, setErrorList] = useState([]); 
  const editorRef = useRef(null);

  // Auto-analyze code 2 seconds after user stops typing
  useEffect(() => {
    if (!code) return;
    setStatusText("Typing...");
    const timeoutId = setTimeout(() => { handleAnalyze(code); }, 2000);
    return () => clearTimeout(timeoutId);
  }, [code]);

  // Function to send code to the "Brain" (Server)
  const handleAnalyze = async (currentCode) => {
    setAnalyzing(true);
    setStatusText("Analyzing...");
    
    try {
      // Send code to the server
      const res = await axios.post("http://localhost:5000/analyze", { code: currentCode });
      const { errors, plagiarism } = res.data;
      
      // Update red squiggly lines in the editor
      if (editorRef.current) {
        const markers = errors.map(err => ({
          startLineNumber: err.line,
          startColumn: 1,
          endLineNumber: err.line,
          endColumn: 100,
          message: err.message,
          severity: err.severity === "Error" ? 8 : 4 // 8 = Error, 4 = Warning
        }));
        window.monaco.editor.setModelMarkers(editorRef.current.getModel(), "owner", markers);
      }

      // Update the Right Panel
      setErrorList(errors);
      setPlagData(plagiarism);
      setStatusText("Up to date");

    } catch (err) {
      console.error(err);
      setStatusText("Offline");
    }
    setAnalyzing(false);
  };

  // NEW: Function to submit assignment to Teacher
  const handleSubmit = async () => {
    if (!code) return;
    
    const name = prompt("Enter your name to submit this assignment:");
    if (!name) return;

    try {
      // Use the plagiarism score from the last analysis (or 0 if none)
      const score = plagiarismData ? plagiarismData.similarity_score : 0;

      await axios.post("http://localhost:5000/submit", {
          studentName: name,
          code: code,
          plagiarismScore: score
      });
      
      alert("✅ Assignment submitted successfully! The teacher can now see it.");
    } catch (err) {
      alert("❌ Failed to submit. Is the server running?");
      console.error(err);
    }
  };

  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <header className="main-header">
        <div className="brand">
          <h2>CodeInsight</h2>
          <span>AI Debugger</span>
          <div className={`status-dot ${analyzing ? "busy" : "ready"}`} style={{marginLeft: '20px'}}>
             {statusText}
          </div>
        </div>
        <div className="header-actions">
           <button onClick={handleSubmit} className="btn-submit">Submit Assignment</button>
           <button onClick={onLogout} className="btn-logout">Logout</button>
        </div>
      </header>

      {/* SPLIT SCREEN VIEW */}
      <div className="split-view">
        
        {/* LEFT SIDE: Code Editor */}
        <div className="editor-pane">
          <div className="pane-header">📝 Source Editor (C Language)</div>
          <Editor
            height="100%"
            theme="vs-dark"
            defaultLanguage="c"
            value={code}
            onChange={(val) => setCode(val)}
            onMount={(editor) => (editorRef.current = editor)}
            options={{ 
                minimap: { enabled: false }, 
                fontSize: 14, 
                fontFamily: 'Fira Code',
                padding: { top: 20 },
                scrollBeyondLastLine: false
            }}
          />
        </div>

        {/* RIGHT SIDE: AI Report */}
        <div className="output-pane">
          <div className="pane-header">🤖 AI Analysis Report</div>
          <div className="analysis-content">
            
            {/* Plagiarism Score Card */}
            {plagiarismData && (
              <div className={`result-card ${plagiarismData.similarity_score > 50 ? 'danger' : 'safe'}`}>
                 <h4>Unique Code Score</h4>
                 <div className="score-row">
                    <span className="big-score">{100 - plagiarismData.similarity_score}%</span>
                    <span className="label">Originality Rating</span>
                 </div>
              </div>
            )}

            <h4 style={{ color: '#8b949e', marginTop: '10px' }}>Detected Issues ({errorList.length})</h4>
            
            {/* List of Errors */}
            {errorList.length === 0 ? (
               <div className="empty-state">No errors found. Great code! ✨</div>
            ) : (
               <div className="error-list">
                 {errorList.map((err, index) => (
                   <div key={index} className={`error-item ${err.severity === "Error" ? "error" : "warning"}`}>
                      <div className="error-header">
                        <span className="line-badge">Line {err.line}</span>
                        <span className="severity-badge">{err.severity}</span>
                      </div>
                      <p className="error-msg">{err.message}</p>
                   </div>
                 ))}
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentView;