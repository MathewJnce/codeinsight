import React, { useState } from "react";
import Login from "./Login";
import StudentView from "./StudentView";
import TeacherView from "./TeacherView";
import "./App.css";

function App() {
  const [userRole, setUserRole] = useState(null); // 'student' | 'teacher' | null

  return (
    <div className="app-root">
      {/* 1. If not logged in, show Login Screen */}
      {!userRole && <Login onLogin={setUserRole} />}

      {/* 2. Show Student Dashboard */}
      {userRole === "student" && (
        <StudentView onLogout={() => setUserRole(null)} />
      )}

      {/* 3. Show Teacher Dashboard */}
      {userRole === "teacher" && (
        <TeacherView onLogout={() => setUserRole(null)} />
      )}
    </div>
  );
}

export default App;