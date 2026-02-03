const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// --- EMERGENCY SIMULATION MODE (Safe for Viva) ---

app.post("/analyze", (req, res) => {
    const { code } = req.body;
    const errors = [];
    const codeLines = code.split('\n');

    // Simple checks for demo
    codeLines.forEach((line, index) => {
        const trimmed = line.trim();
        if (trimmed.length > 0 && !trimmed.startsWith("//") && !trimmed.startsWith("#") && 
            !trimmed.endsWith(";") && !trimmed.endsWith("}") && !trimmed.endsWith("{") && 
            !trimmed.includes("if") && !trimmed.includes("else")) {
            errors.push({ line: index + 1, message: "Syntax Error: Missing semicolon ';'", severity: "Error" });
        }
    });

    res.json({
        errors: errors,
        plagiarism: { similarity_score: code.length > 50 ? 12 : 0, notes: "Simulation Check" }
    });
});

// --- SUBMISSIONS DATABASE (In-Memory) ---
let submissions = [];

app.post("/submit", (req, res) => {
    const { studentName, code, plagiarismScore } = req.body;
    submissions.push({
        id: submissions.length + 1,
        studentName,
        code,
        plagiarismScore,
        grade: null, // New: Starts as null
        timestamp: new Date().toLocaleTimeString()
    });
    res.json({ message: "Success" });
});

app.get("/submissions", (req, res) => {
    res.json(submissions);
});

// --- NEW: GRADING ENDPOINT ---
app.post("/grade", (req, res) => {
    const { id, grade } = req.body;
    // Find the student and update their grade
    const student = submissions.find(s => s.id === id);
    if (student) {
        student.grade = grade;
        res.json({ message: "Graded successfully", student });
    } else {
        res.status(404).json({ message: "Student not found" });
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} (Grading Enabled)`));