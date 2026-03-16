import React, { useState } from "react";
import Login from "./Login";
import LandingPage from "./LandingPage"; 
import StudentView from "./StudentView";
import TeacherView from "./TeacherView";
import AnalyticsView from "./AnalyticsView"; // <-- NEW IMPORT
import "./App.css";

function App() {
  const [user, setUser] = useState(null); // 'Student' or 'Teacher'
  const [currentPage, setCurrentPage] = useState("login"); // 'login', 'landing', 'student-view', 'teacher-view', 'analytics-view'

  const handleLogin = (role) => {
    setUser(role);
    setCurrentPage("landing"); 
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage("login");
  };

  return (
    <div>
      {currentPage === "login" && <Login onLogin={handleLogin} />}
      
      {currentPage === "landing" && (
        <LandingPage 
          userType={user} 
          onNavigate={handleNavigate} 
          onLogout={handleLogout} 
        />
      )}

      {currentPage === "student-view" && <StudentView onLogout={handleLogout} />}
      
      {currentPage === "teacher-view" && <TeacherView onLogout={handleLogout} />}

      {/* --- NEW ANALYTICS ROUTE --- */}
      {currentPage === "analytics-view" && (
        <AnalyticsView 
          userRole={user} 
          onBack={() => setCurrentPage("landing")} 
        />
      )}
    </div>
  );
}

export default App;