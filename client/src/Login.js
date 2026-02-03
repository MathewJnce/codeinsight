import React from "react";

function Login({ onLogin }) {
  return (
    <div className="login-container">
      <h1>CodeInsight Login</h1>
      <div className="login-card">
        <button className="btn-role student" onClick={() => onLogin("student")}>
          Login as Student
        </button>
        <button className="btn-role teacher" onClick={() => onLogin("teacher")}>
          Login as Teacher
        </button>
      </div>
    </div>
  );
}

export default Login;