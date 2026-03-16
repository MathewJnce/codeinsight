const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { exec, spawn } = require('child_process'); 
const path = require('path');              
const http = require('http'); 
const { Server } = require('socket.io'); 

const app = express();
app.use(cors());
app.use(express.json());

// --- WEBSOCKET SERVER SETUP ---
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const DB_FILE = './database.json';

// --- DATABASE HELPERS (multi-collection) ---
function readFullDB() {
    if (!fs.existsSync(DB_FILE)) return { submissions: [], users: [], tests: [], testAttempts: [], practiceSessions: [] };
    try {
        const raw = JSON.parse(fs.readFileSync(DB_FILE));
        if (Array.isArray(raw)) return { submissions: raw, users: [], tests: [], testAttempts: [], practiceSessions: [] };
        return {
            submissions: raw.submissions || [],
            users: raw.users || [],
            tests: raw.tests || [],
            testAttempts: raw.testAttempts || [],
            practiceSessions: raw.practiceSessions || []
        };
    } catch (e) { 
        return { submissions: [], users: [], tests: [], testAttempts: [], practiceSessions: [] }; 
    }
}

function writeFullDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

const readDB = () => readFullDB().submissions;
const writeDB = (data) => {
    const full = readFullDB();
    full.submissions = data;
    writeFullDB(full);
};

// --- HEALTH CHECK FOR ANALYTICS BAR ---
app.get("/", (req, res) => res.json({ status: "Alive" }));

// --- USER AUTHENTICATION & REGISTRATION ---
app.post("/register", (req, res) => {
    try {
        const { fullName, email, password, role } = req.body;
        if (!fullName || !email || !password || !role) {
            return res.status(400).json({ message: "All fields are required." });
        }
        const fullDB = readFullDB();
        if (fullDB.users.find(u => u.email === email)) {
            return res.status(400).json({ message: "An account with this email already exists." });
        }
        const newUser = { id: Date.now(), fullName, email, password, role };
        fullDB.users.push(newUser);
        writeFullDB(fullDB);
        res.status(201).json({ message: "Registration successful", user: newUser });
    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ message: "Internal server error during registration." });
    }
});

app.post("/login", (req, res) => {
    try {
        const { email, password, role } = req.body;
        if (!email || !password || !role) {
            return res.status(400).json({ message: "Email, password, and role are required." });
        }
        const fullDB = readFullDB();
        const user = fullDB.users.find(u => u.email === email && u.password === password && u.role === role);
        if (user) {
            res.json({ message: "Login successful", user });
        } else {
            res.status(401).json({ message: "Invalid email, password, or account type." });
        }
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Internal server error during login." });
    }
});

// --- LIVE INTERACTIVE COMPILER ENGINE (WebSockets) ---
io.on("connection", (socket) => {
    let currentProcess = null;

    socket.on("run_code", ({ code }) => {
        const uniqueId = Date.now();
        const filePath = path.join(__dirname, `temp_${uniqueId}.c`);
        const outPath = process.platform === 'win32' ? path.join(__dirname, `temp_${uniqueId}.exe`) : path.join(__dirname, `temp_${uniqueId}.out`);

        const unbufferedCode = `#include <stdio.h>\nvoid __attribute__((constructor)) init_buffer() { setvbuf(stdout, NULL, _IONBF, 0); setvbuf(stderr, NULL, _IONBF, 0); }\n` + code;
        fs.writeFileSync(filePath, unbufferedCode);

        exec(`gcc "${filePath}" -o "${outPath}"`, (compileErr, stdout, stderr) => {
            if (compileErr) {
                socket.emit("output", stderr || compileErr.message);
                socket.emit("execution_end");
                try { fs.unlinkSync(filePath); } catch(e){}
                return;
            }

            currentProcess = spawn(outPath);

            currentProcess.stdout.on("data", (data) => socket.emit("output", data.toString()));
            currentProcess.stderr.on("data", (data) => socket.emit("output", data.toString()));

            currentProcess.on("close", (exitCode) => {
                socket.emit("output", `\n\n[Process exited with code ${exitCode}]`);
                socket.emit("execution_end");
                try { fs.unlinkSync(filePath); fs.unlinkSync(outPath); } catch (e) {}
            });
        });
    });

    socket.on("input", (data) => {
        if (currentProcess) currentProcess.stdin.write(data + "\n");
    });

    socket.on("disconnect", () => {
        if (currentProcess) currentProcess.kill();
    });
});

// --- REAL PLAGIARISM ALGORITHM (Sørensen–Dice) ---
function calculateSimilarity(str1, str2) {
    const normalize = (s) => s.replace(/\/\/.*|\/\*[\s\S]*?\*\/|\s+/g, '').toLowerCase();
    const s1 = normalize(str1);
    const s2 = normalize(str2);

    if (s1 === s2) return 100; 
    if (s1.length < 2 || s2.length < 2) return 0; 

    let bigrams1 = new Map();
    for (let i = 0; i < s1.length - 1; i++) {
        const bg = s1.substring(i, i + 2);
        bigrams1.set(bg, (bigrams1.get(bg) || 0) + 1);
    }

    let intersectionSize = 0;
    for (let i = 0; i < s2.length - 1; i++) {
        const bg = s2.substring(i, i + 2);
        const count = bigrams1.get(bg);
        if (count > 0) {
            bigrams1.set(bg, count - 1);
            intersectionSize++;
        }
    }

    const totalBigrams = (s1.length - 1) + (s2.length - 1);
    return Math.round((2.0 * intersectionSize) / totalBigrams * 100);
}

// --- THE ULTIMATE EXAMINER ENGINE ---
app.post("/analyze", (req, res) => {
    const { code } = req.body;
    const errors = [];
    
    if (!code) return res.json({ errors: [], plagiarism: { similarity_score: 0 } });

    const lines = code.split('\n');
    let hasMain = false;
    let openBraces = 0;

    // --- VARIABLE TRACKER FOR DIVISION BY ZERO ---
    const zeroVariables = [];
    lines.forEach(line => {
        const clean = line.split("//")[0].split("/*")[0].trim();
        const zeroMatch = clean.match(/(?:int|float|double)\s+([a-zA-Z_]\w*)\s*=\s*0(?:\.0*)?\s*;/);
        if (zeroMatch) zeroVariables.push(zeroMatch[1]);
    });

    if (!code.includes("#include <stdio.h>")) {
        errors.push({ line: 1, message: "Linker Error: <stdio.h> is missing. 'printf' and 'scanf' will fail.", severity: "Error" });
    }
    if ((code.includes("malloc") || code.includes("free")) && !code.includes("#include <stdlib.h>")) {
        errors.push({ line: 1, message: "Linker Error: Using malloc/free requires <stdlib.h>.", severity: "Error" });
    }
    if ((code.includes("strlen") || code.includes("strcpy")) && !code.includes("#include <string.h>")) {
        errors.push({ line: 1, message: "Linker Error: String functions require <string.h>.", severity: "Error" });
    }

    lines.forEach((line, index) => {
        const originalLine = line.trim();
        const n = index + 1;

        // Strip inline comments away before doing syntax checks!
        const cleanLine = originalLine.split("//")[0].split("/*")[0].trim();

        if (cleanLine.length === 0) return; // Skip completely empty lines

        openBraces += (cleanLine.match(/{/g) || []).length;
        openBraces -= (cleanLine.match(/}/g) || []).length;

        if (cleanLine.includes("main()")) hasMain = true;

        // --- NEW: Void main() check ---
        if (cleanLine.includes("void main()")) {
             errors.push({ line: n, message: "Standard Warning: 'void main()' is outdated and not standard. Always use 'int main()'.", severity: "Warning" });
        }

        // --- NEW: Math library check ---
        if ((cleanLine.includes("pow(") || cleanLine.includes("sqrt(") || cleanLine.includes("sin(")) && !code.includes("<math.h>")) {
             errors.push({ line: n, message: "Linker Error: Using math functions like pow/sqrt requires '#include <math.h>'.", severity: "Error" });
        }

        // --- NEW: Single vs Double quotes mismatch for chars ---
        if (cleanLine.match(/char\s+[a-zA-Z_]\w*\s*=\s*".*"/)) {
             errors.push({ line: n, message: "Type Error: You are trying to assign a string (double quotes) to a single 'char'. Use single quotes (e.g., 'A').", severity: "Error" });
        }

        // SMARTER SEMICOLON CHECK
        if (!cleanLine.startsWith("#") && 
            !cleanLine.endsWith(";") && !cleanLine.endsWith("}") && !cleanLine.endsWith("{") && !cleanLine.endsWith(":") && !cleanLine.endsWith(">") &&
            !cleanLine.includes("if") && !cleanLine.includes("else") && !cleanLine.includes("for") && !cleanLine.includes("while") && 
            !cleanLine.includes("main") && !cleanLine.includes("switch") && !cleanLine.includes("do")) {
            errors.push({ line: n, message: "Syntax Error: Missing semicolon ';'", severity: "Error" });
        }

        if (cleanLine.includes("scanf") && !cleanLine.includes("&") && !cleanLine.includes("%s")) {
             errors.push({ line: n, message: "Logic Warning: 'scanf' usually requires '&' (unless reading a string).", severity: "Warning" });
        }

        if (cleanLine.includes("if (") && cleanLine.includes("=") && !cleanLine.includes("==") && !cleanLine.includes("!=")) {
            errors.push({ line: n, message: "Logic Warning: You are using assignment '=' inside 'if'. Did you mean comparison '=='?", severity: "Warning" });
        }

        // --- NEW: Assignment inside while loop check ---
        if (cleanLine.includes("while (") && cleanLine.includes("=") && !cleanLine.includes("==") && !cleanLine.includes("!=")) {
            errors.push({ line: n, message: "Logic Error: Assignment '=' inside 'while' condition creates an infinite loop. Use '==' for comparison.", severity: "Error" });
        }

        if (cleanLine.includes("gets(")) {
            errors.push({ line: n, message: "Security Error: 'gets' is dangerous and deprecated. Use 'fgets' instead.", severity: "Error" });
        }

        // UPGRADED DIVISION BY ZERO CHECK
        if (cleanLine.includes("/ 0") || cleanLine.includes("/0")) {
            errors.push({ line: n, message: "Runtime Error: Explicit Division by Zero.", severity: "Error" });
        } else {
            zeroVariables.forEach(v => {
                const regex = new RegExp("\\/\\s*" + v + "\\b");
                if (regex.test(cleanLine)) {
                    errors.push({ line: n, message: `Runtime Error: Division by Zero (variable '${v}' equals 0).`, severity: "Error" });
                }
            });
        }

        if (cleanLine.includes("free(") && cleanLine.includes("&")) {
            errors.push({ line: n, message: "Memory Error: You cannot 'free' a variable that wasn't allocated with malloc.", severity: "Error" });
        }
        
        if (cleanLine.includes("fopen") && !code.includes("NULL")) {
             errors.push({ line: n, message: "Best Practice: You opened a file but didn't check if it returns NULL (file might not exist).", severity: "Warning" });
        }

        const arrayDecl = cleanLine.match(/\[(\d+)\]/);
        if (arrayDecl) {
            const size = parseInt(arrayDecl[1]);
            if (cleanLine.includes(`[${size}]`) && !cleanLine.includes("int ") && !cleanLine.includes("char ") && !cleanLine.includes("float ") && !cleanLine.includes("double ")) {
                errors.push({ line: n, message: `Index Error: Array index '${size}' is out of bounds. Valid indices are 0 to ${size-1}.`, severity: "Error" });
            }
        }
    });

    if (!hasMain) {
        errors.push({ line: 1, message: "Linker Error: Code is missing 'int main()' function.", severity: "Error" });
    }
    if (openBraces !== 0) {
        errors.push({ line: lines.length, message: `Syntax Error: Mismatched braces. You have ${Math.abs(openBraces)} unclosed/extra '}'.`, severity: "Error" });
    }

    // --- REAL PLAGIARISM CHECK EXECUTION ---
    const dbSubmissions = readDB(); 
    let highestPlagiarism = 0;
    let copiedFrom = "None";

    if (code.length > 20 && dbSubmissions.length > 0) {
        dbSubmissions.forEach(pastSub => {
            const score = calculateSimilarity(code, pastSub.code);
            if (score > highestPlagiarism) {
                highestPlagiarism = score;
                copiedFrom = pastSub.studentName || pastSub.email || "Unknown Student";
            }
        });
    }

    res.json({
        errors: errors,
        plagiarism: { 
            similarity_score: highestPlagiarism, 
            notes: highestPlagiarism > 20 ? `High similarity detected with previous submission by: ${copiedFrom}` : "Code looks original." 
        }
    });
});

// --- SUBMISSIONS & GRADING ---
app.post("/submit", (req, res) => {
    try {
        const { studentName, email, code, plagiarismScore } = req.body;
        const db = readDB();
        db.push({ id: db.length + 1, studentName, email, code, plagiarismScore, grade: null, timestamp: new Date().toLocaleTimeString() });
        writeDB(db);
        res.json({ message: "Saved" });
    } catch (error) {
        console.error("Submit Error:", error);
        res.status(500).json({ message: "Failed to save submission." });
    }
});

app.get("/submissions", (req, res) => { 
    try {
        res.json(readDB()); 
    } catch (error) {
        res.status(500).json({ message: "Failed to retrieve submissions." });
    }
});

app.post("/grade", (req, res) => {
    try {
        const { id, grade } = req.body;
        const db = readDB();
        const student = db.find(s => s.id === id);
        if (student) { 
            student.grade = grade; 
            writeDB(db); 
            res.json({ message: "Graded", student }); 
        } else { 
            res.status(404).json({ message: "Submission not found" }); 
        }
    } catch (error) {
        console.error("Grading Error:", error);
        res.status(500).json({ message: "Failed to apply grade." });
    }
});

const PORT = 5000;
server.listen(PORT, () => console.log(`Server running (ULTIMATE LIVE MODE) on port ${PORT}`));