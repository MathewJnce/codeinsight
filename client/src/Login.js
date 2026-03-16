import React, { useState, useEffect } from "react";
import axios from "axios";

function Login({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [role, setRole] = useState("Student");
  
  // Form States
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Feedback States
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Analytics State
  const [systemStatus, setSystemStatus] = useState("CONNECTING...");
  const [sessionId, setSessionId] = useState("PENDING");

  useEffect(() => {
    setSessionId("DX-" + Math.random().toString(36).substring(2, 9).toUpperCase());
    const checkBackend = async () => {
      try {
        const response = await axios.get("http://localhost:5000/");
        if (response.data) setSystemStatus("STABLE");
      } catch (err) {
        setSystemStatus("OFFLINE");
      }
    };
    checkBackend();
    const interval = setInterval(checkBackend, 10000);
    return () => clearInterval(interval);
  }, []);

  // --- STRICT FORM VALIDATION LOGIC ---
  const validateForm = () => {
    setError("");
    setSuccess("");
    
    // 1. Check for empty fields
    if (!email.trim() || !password.trim()) {
        return "Email and Password are required.";
    }

    // 2. Validate Email Format strictly
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return "Please enter a valid email format (e.g., student@university.edu).";
    }

    // 3. Password length check
    if (password.length < 6) {
        return "Password must be at least 6 characters long.";
    }
    
    // 4. Registration-specific checks
    if (isRegistering) {
      if (!fullName.trim()) return "Full name is required for registration.";
      if (password !== confirmPassword) return "Passwords do not match.";
    }
    
    return null; // Passes all checks
  };

  const handleAction = async (e) => {
    e.preventDefault();
    
    // Run validation first
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return; // Stop execution if validation fails
    }

    if (isRegistering) {
      // --- REGISTER API CALL ---
      try {
        await axios.post("http://localhost:5000/register", {
          fullName, email, password, role
        });
        setSuccess("Account created successfully! You can now sign in.");
        setIsRegistering(false); // Auto-switch to login view
        setPassword("");
        setConfirmPassword("");
      } catch (err) {
        setError(err.response?.data?.message || "Registration failed. Server offline?");
      }
    } else {
      // --- LOGIN API CALL ---
      try {
        const res = await axios.post("http://localhost:5000/login", {
          email, password, role
        });
        onLogin(res.data.user.role); 
      } catch (err) {
        setError(err.response?.data?.message || "Invalid credentials or wrong role selected.");
      }
    }
  };

  // Toggle between Login and Register views
  const switchMode = () => {
    setIsRegistering(!isRegistering);
    setError("");
    setSuccess("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div style={styles.container}>
      <div style={styles.gridBackground}></div>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.logo}>Code<span style={styles.logoHighlight}>Insight</span></h1>
          <p style={styles.subtitle}>// {isRegistering ? "create your account" : "precision in every line. clarity in every bug."}</p>
        </div>

        <div style={styles.toggleContainer}>
          <button type="button" style={role === "Student" ? styles.toggleActive : styles.toggleInactive} onClick={() => setRole("Student")}>
            Student Account
          </button>
          <button type="button" style={role === "Teacher" ? styles.toggleActive : styles.toggleInactive} onClick={() => setRole("Teacher")}>
            Teacher Account
          </button>
        </div>

        {/* Added HTML5 NOVALIDATE to let our custom React validation handle errors gracefully */}
        <form onSubmit={handleAction} style={styles.form} noValidate>
          {error && <div style={styles.errorBanner}>{error}</div>}
          {success && <div style={styles.successBanner}>{success}</div>}

          {isRegistering && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>FULL NAME</label>
              {/* Added required HTML5 attribute */}
              <input type="text" placeholder="Name" value={fullName} onChange={(e) => setFullName(e.target.value)} style={styles.input} required />
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>EMAIL ADDRESS</label>
            <input type="email" placeholder="name@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} required />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>PASSWORD</label>
            <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} required minLength="6" />
          </div>

          {isRegistering && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>CONFIRM PASSWORD</label>
              <input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={styles.input} required minLength="6" />
            </div>
          )}

          <button type="submit" style={styles.button}>{isRegistering ? "Create Account" : "Sign In"}</button>
        </form>

        <div style={styles.footer}>
          <p style={{fontSize: '12px', color: '#64748b'}}>
            {isRegistering ? "Already have an account? " : "New to CodeInsight? "}
            <span style={styles.link} onClick={switchMode}>
              {isRegistering ? "Sign In Instead" : "Register Now"}
            </span>
          </p>
          <div style={{...styles.systemStatus, color: systemStatus === "STABLE" ? "#10b981" : "#ef4444"}}>
            SYSTEM_STATUS: {systemStatus} // SESSION_ID: {sessionId}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { height: "100vh", width: "100vw", display: "flex", justifyContent: "center", alignItems: "center", background: "#0f172a", position: "relative", overflow: "hidden", fontFamily: "'Inter', sans-serif" },
  gridBackground: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundImage: "radial-gradient(#1e293b 1px, transparent 1px)", backgroundSize: "30px 30px", opacity: 0.5 },
  card: { position: "relative", width: "400px", background: "#ffffff", borderRadius: "24px", padding: "40px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)", textAlign: "center", zIndex: 10 },
  header: { marginBottom: "30px" },
  logo: { fontSize: "32px", fontWeight: "800", color: "#0f172a", margin: "0 0 10px 0", letterSpacing: "-1px" },
  logoHighlight: { color: "#f97316" },
  subtitle: { fontFamily: "'Courier New', monospace", fontSize: "11px", color: "#64748b", margin: 0 },
  toggleContainer: { display: "flex", background: "#f1f5f9", padding: "5px", borderRadius: "12px", marginBottom: "25px" },
  toggleActive: { flex: 1, padding: "10px", border: "none", background: "#ffffff", color: "#0f172a", fontWeight: "600", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", cursor: "pointer" },
  toggleInactive: { flex: 1, padding: "10px", border: "none", background: "transparent", color: "#64748b", fontWeight: "500", borderRadius: "8px", cursor: "pointer" },
  form: { textAlign: "left" },
  inputGroup: { marginBottom: "15px" },
  label: { fontSize: "10px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px", display: "block" },
  input: { width: "100%", padding: "12px 15px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px", outline: "none", background: "#f8fafc", boxSizing: "border-box" },
  button: { width: "100%", padding: "14px", background: "#0f172a", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", marginTop: "10px" },
  errorBanner: { background: "#fee2e2", color: "#ef4444", padding: "10px", borderRadius: "6px", fontSize: "12px", marginBottom: "15px", textAlign: "center", fontWeight: "500" },
  successBanner: { background: "#dcfce7", color: "#166534", padding: "10px", borderRadius: "6px", fontSize: "12px", marginBottom: "15px", textAlign: "center", fontWeight: "500" },
  footer: { marginTop: "25px", borderTop: "1px solid #e2e8f0", paddingTop: "20px" },
  link: { color: "#f97316", fontWeight: "600", cursor: "pointer" },
  systemStatus: { marginTop: "20px", fontSize: "9px", fontFamily: "'Courier New', monospace", textTransform: "uppercase", letterSpacing: "1px" }
};

export default Login;