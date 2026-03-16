import React, { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import { io } from "socket.io-client"; // <-- Import the WebSocket client

function StudentView({ onLogout }) {
  const [code, setCode] = useState(`// Professional Workspace\n#include <stdio.h>\n\nint main() {\n    int n;\n    printf("Enter a number: ");\n    scanf("%d", &n);\n    printf("You entered: %d\\n", n);\n    return 0;\n}`);
  
  const [statusText, setStatusText] = useState("Ready");
  const [errorList, setErrorList] = useState([]);
  const [plagiarismScore, setPlagiarismScore] = useState(0); 
  
  // --- LIVE TERMINAL STATES ---
  const [terminalOutput, setTerminalOutput] = useState("");
  const [terminalInput, setTerminalInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  
  const editorRef = useRef(null);
  const socketRef = useRef(null);
  const terminalBottomRef = useRef(null);

  // Auto-analyze with debounce
  useEffect(() => {
    if (!code) return;
    setStatusText("Syncing...");
    const timeoutId = setTimeout(() => { handleAnalyze(code); }, 1500);
    return () => clearTimeout(timeoutId);
  }, [code]);

  // --- CONNECT WEBSOCKETS ---
  useEffect(() => {
    socketRef.current = io("http://localhost:5000");
    
    // Listen for live text coming from the C program
    socketRef.current.on("output", (data) => {
      setTerminalOutput((prev) => prev + data);
    });

    // Listen for the program finishing
    socketRef.current.on("execution_end", () => {
      setIsRunning(false);
    });

    return () => socketRef.current.disconnect();
  }, []);

  // Auto-scroll the terminal down when new text appears
  useEffect(() => {
    if (terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [terminalOutput]);

  const handleAnalyze = async (currentCode) => {
    try {
      const res = await axios.post("http://localhost:5000/analyze", { code: currentCode });
      const { errors, plagiarism } = res.data;
      
      if (editorRef.current) {
        const markers = errors.map(err => ({
          startLineNumber: err.line,
          startColumn: 1,
          endLineNumber: err.line,
          endColumn: 100,
          message: err.message,
          severity: err.severity === "Error" ? 8 : 4
        }));
        window.monaco.editor.setModelMarkers(editorRef.current.getModel(), "owner", markers);
      }

      setErrorList(errors);
      setPlagiarismScore(plagiarism.similarity_score); 
      setStatusText("Up to date");
    } catch (err) {
      setStatusText("Offline");
    }
  };

  // --- RUN LIVE CODE ---
  const handleRunCode = () => {
    setTerminalOutput(""); // Clear old text
    setIsRunning(true);
    socketRef.current.emit("run_code", { code }); // Tell server to start
  };

  // --- HANDLE LIVE KEYBOARD INPUT ---
  const handleTerminalInput = (e) => {
    if (e.key === "Enter") {
      socketRef.current.emit("input", terminalInput); // Send to C program
      setTerminalOutput((prev) => prev + terminalInput + "\n"); // Print it visually on screen
      setTerminalInput(""); // Clear the input box
    }
  };

  const handleSubmit = async () => {
    const name = prompt("Enter full name for submission:");
    if (!name) return;
    try {
      await axios.post("http://localhost:5000/submit", { 
          studentName: name, 
          email: "student@test.com", 
          code: code,
          plagiarismScore: plagiarismScore 
      });
      alert("✅ Submission Successful");
    } catch (err) {
      alert("❌ Connection Error");
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.brandGroup}>
          <h2 style={styles.logo}>CodeInsight <span style={styles.logoAccent}>Pro</span></h2>
          <div style={{...styles.statusBadge, color: statusText === "Offline" ? "#ff4444" : "#3fb950"}}>
            <span style={styles.dot}>●</span> {statusText}
          </div>
        </div>
        <div style={styles.actionGroup}>
          <button onClick={handleRunCode} disabled={isRunning} style={styles.runBtn}>
            {isRunning ? "Running..." : "▶ Run Code"}
          </button>
          <button onClick={handleSubmit} style={styles.primaryBtn}>Submit Assignment</button>
          <button onClick={onLogout} style={styles.secondaryBtn}>Log Out</button>
        </div>
      </header>

      <main style={styles.main}>
        {/* LEFT COLUMN: EDITOR & TERMINAL */}
        <section style={styles.editorPane}>
          <div style={styles.paneHeader}>SOURCE_CODE.C</div>
          
          <div style={{ flex: 1, overflow: "hidden" }}>
            <Editor
              height="100%"
              theme="vs-dark"
              defaultLanguage="c"
              value={code}
              onChange={(val) => setCode(val)}
              onMount={(editor) => (editorRef.current = editor)}
              options={{ minimap: { enabled: false }, fontSize: 14, fontFamily: "'Fira Code', monospace", padding: { top: 20 } }}
            />
          </div>

          {/* --- NEW UNIFIED LIVE TERMINAL --- */}
          <div style={styles.terminalContainer}>
            <div style={styles.paneHeader}>INTERACTIVE_TERMINAL (Live Input)</div>
            
            {/* Click anywhere in the black box to focus the typing area */}
            <div style={styles.terminalWindow} onClick={() => document.getElementById("terminal-input")?.focus()}>
              <pre style={styles.terminalText}>
                {terminalOutput || "> Ready to compile. Click 'Run Code' to execute."}
              </pre>
              
              {/* Only show the blinking input line if the program is running and waiting for input */}
              {isRunning && (
                <div style={styles.inputRow}>
                  <span style={styles.promptArrow}>❯</span>
                  <input
                    id="terminal-input"
                    style={styles.terminalInputField}
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    onKeyDown={handleTerminalInput}
                    autoComplete="off"
                    autoFocus
                  />
                </div>
              )}
              {/* Invisible div to help auto-scroll to bottom */}
              <div ref={terminalBottomRef} />
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: AI INSIGHTS SIDEBAR */}
        <aside style={styles.sidebar}>
          <div style={styles.paneHeader}>AI_INSIGHTS_REPORT</div>
          <div style={styles.sidebarContent}>
            
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                <div style={styles.summaryCard}>
                  <span style={styles.cardLabel}>ISSUES</span>
                  <span style={styles.cardValue}>{errorList.length}</span>
                </div>
                
                <div style={{...styles.summaryCard, borderLeft: plagiarismScore > 20 ? "3px solid #f85149" : "3px solid #3fb950"}}>
                  <span style={styles.cardLabel}>PLAGIARISM</span>
                  <span style={{...styles.cardValue, color: plagiarismScore > 20 ? "#f85149" : "#3fb950"}}>{plagiarismScore}%</span>
                </div>
            </div>

            {errorList.length === 0 ? (
              <div style={styles.emptyState}>
                <p>No issues detected. Code is optimized. ✨</p>
              </div>
            ) : (
              errorList.map((err, i) => (
                <div key={i} style={{...styles.errorCard, borderLeft: `4px solid ${err.severity === "Error" ? "#f85149" : "#d29922"}`}}>
                  <div style={styles.cardHeader}>
                    <span style={styles.lineTag}>L{err.line}</span>
                    <span style={{...styles.severity, color: err.severity === "Error" ? "#f85149" : "#d29922"}}>{err.severity}</span>
                  </div>
                  <p style={styles.message}>{err.message}</p>
                </div>
              ))
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}

const styles = {
  container: { height: "100vh", background: "#0d1117", color: "#c9d1d9", display: "flex", flexDirection: "column", fontFamily: "'Inter', sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 24px", height: "64px", background: "#161b22", borderBottom: "1px solid #30363d" },
  brandGroup: { display: "flex", alignItems: "center", gap: "20px" },
  logo: { margin: 0, fontSize: "20px", fontWeight: "700", letterSpacing: "-0.5px" },
  logoAccent: { color: "#f97316", fontWeight: "400", fontSize: "14px" },
  statusBadge: { fontSize: "12px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px", background: "rgba(0,0,0,0.2)", padding: "4px 12px", borderRadius: "12px" },
  actionGroup: { display: "flex", gap: "12px" },
  runBtn: { background: "#1f6feb", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", fontWeight: "600", cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", gap: "5px" },
  primaryBtn: { background: "#238636", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", fontWeight: "600", cursor: "pointer", fontSize: "13px" },
  secondaryBtn: { background: "transparent", color: "#8b949e", border: "1px solid #30363d", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "13px" },
  main: { display: "flex", flex: 1, overflow: "hidden" },
  editorPane: { flex: 1, display: "flex", flexDirection: "column", borderRight: "1px solid #30363d" },
  
  // --- UNIFIED TERMINAL STYLES ---
  terminalContainer: { height: "250px", borderTop: "1px solid #30363d", display: "flex", flexDirection: "column" },
  terminalWindow: { flex: 1, padding: "15px", overflowY: "auto", background: "#010409", display: "flex", flexDirection: "column", cursor: "text" },
  terminalText: { margin: 0, color: "#e6edf3", fontFamily: "'Fira Code', monospace", fontSize: "13px", whiteSpace: "pre-wrap" },
  inputRow: { display: "flex", alignItems: "center", marginTop: "5px" },
  promptArrow: { color: "#3fb950", marginRight: "10px", fontFamily: "'Fira Code', monospace", fontSize: "13px" },
  terminalInputField: { flex: 1, background: "transparent", border: "none", color: "#e6edf3", fontFamily: "'Fira Code', monospace", fontSize: "13px", outline: "none" },
  
  paneHeader: { padding: "10px 16px", background: "#0d1117", borderBottom: "1px solid #30363d", fontSize: "11px", fontWeight: "700", color: "#8b949e", letterSpacing: "1px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  sidebar: { width: "380px", background: "#0d1117", display: "flex", flexDirection: "column" },
  sidebarContent: { padding: "20px", overflowY: "auto" },
  summaryCard: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", background: "#161b22", padding: "16px", borderRadius: "8px", border: "1px solid #30363d" },
  cardLabel: { fontSize: "10px", fontWeight: "700", color: "#8b949e", marginBottom: "8px" },
  cardValue: { fontSize: "24px", fontWeight: "700", color: "#f97316" },
  errorCard: { background: "#161b22", padding: "16px", borderRadius: "6px", marginBottom: "12px", border: "1px solid #30363d" },
  cardHeader: { display: "flex", justifyContent: "space-between", marginBottom: "8px" },
  lineTag: { background: "#30363d", padding: "2px 8px", borderRadius: "4px", fontSize: "10px", color: "#c9d1d9", fontWeight: "700" },
  severity: { fontSize: "10px", fontWeight: "800", textTransform: "uppercase" },
  message: { margin: 0, fontSize: "13px", color: "#e6edf3", lineHeight: "1.5" },
  emptyState: { textAlign: "center", marginTop: "60px", color: "#8b949e", fontStyle: "italic", fontSize: "14px" }
};

export default StudentView;