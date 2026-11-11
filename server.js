
const express = require('express');
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const { Student, Course, Enrollment } = require('./models');

const app = express();

const db = new DatabaseSync(
    path.join(__dirname, 'studentsCourses.db')
);

app.use(express.json());
db.exec('PRAGMA foreign_keys = ON');

// CREATE TABLES
db.exec(`
CREATE TABLE IF NOT EXISTS Students (
    student_id INTEGER PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Courses (
    course_id INTEGER PRIMARY KEY,
    course_code VARCHAR(10) UNIQUE NOT NULL,
    course_name VARCHAR(100) NOT NULL,
    credits INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS Enrollments (
    student_id INTEGER,
    course_id INTEGER,
    registration_date TEXT NOT NULL,
    FOREIGN KEY (student_id) REFERENCES Students(student_id),
    FOREIGN KEY (course_id) REFERENCES Courses(course_id)
);
`);

// DATABASE TABLES
const tables = {
    students: {
        name: 'Students',
        id: 'student_id',
        model: Student,
        fields: ['first_name', 'last_name', 'email']
    },

    courses: {
        name: 'Courses',
        id: 'course_id',
        model: Course,
        fields: ['course_code', 'course_name', 'credits']
    },

    enrollments: {
        name: 'Enrollments',
        id: 'rowid',
        model: Enrollment,
        fields: ['student_id', 'course_id', 'registration_date']
    }
};

// ERROR MESSAGES
function handleError(res, error) {
    const message = error.message;

    if (message.includes('Courses.course_code')) {
        return res.status(400).json({
            error: 'This course code already exists!'
        });
    }

    if (message.includes('Students.email')) {
        return res.status(400).json({
            error: 'This email is already registered!'
        });
    }

    if (message.includes('FOREIGN KEY constraint failed')) {
        return res.status(400).json({
            error: 'This record is linked to another table or the selected student/course does not exist.'
        });
    }

    res.status(400).json({
        error: message
    });
}

// WEBSITE
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/app.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'app.js'));
});

// SELECT
app.get('/api/:type', (req, res) => {
    const t = tables[req.params.type];

    if (!t) {
        return res.status(404).json({
            error: 'Unknown table'
        });
    }

    try {
        let rows;

        if (req.params.type === 'enrollments') {
            rows = db.prepare(`
                SELECT e.rowid AS id, e.student_id, e.course_id,
                       e.registration_date,
                       s.first_name || ' ' || s.last_name AS student_name,
                       c.course_code || ' - ' || c.course_name AS course_label
                FROM Enrollments e
                JOIN Students s ON e.student_id = s.student_id
                JOIN Courses c ON e.course_id = c.course_id
                ORDER BY e.rowid
            `).all();
        } else {
            rows = db.prepare(
                `SELECT ${t.id} AS id, ${t.fields.join(', ')}
                 FROM ${t.name}
                 ORDER BY ${t.id}`
            ).all();
        }

        // Read the database rows through the corresponding OOP classes.
        res.json(rows.map(row => new t.model(row).toJSON()));

    } catch (error) {
        handleError(res, error);
    }
});

// INSERT
app.post('/api/:type', (req, res) => {
    const t = tables[req.params.type];

    if (!t) {
        return res.status(404).json({
            error: 'Unknown table'
        });
    }

    try {
        // Create a Student, Course, or Enrollment object before saving.
        const record = new t.model(req.body);
        const values = t.fields.map(field => record.toRecord()[field]);

        const placeholders = t.fields
            .map(() => '?')
            .join(', ');

        db.prepare(
            `INSERT INTO ${t.name}
             (${t.fields.join(', ')})
             VALUES (${placeholders})`
        ).run(...values);

        res.json({
            message: 'Record inserted successfully!'
        });

    } catch (error) {
        handleError(res, error);
    }
});

// UPDATE
app.put('/api/:type/:id', (req, res) => {
    const t = tables[req.params.type];

    if (!t) {
        return res.status(404).json({
            error: 'Unknown table'
        });
    }

    try {
        // Create a Student, Course, or Enrollment object before saving.
        const record = new t.model(req.body);
        const values = t.fields.map(field => record.toRecord()[field]);

        const setters = t.fields
            .map(field => `${field} = ?`)
            .join(', ');

        const result = db.prepare(
            `UPDATE ${t.name}
             SET ${setters}
             WHERE ${t.id} = ?`
        ).run(...values, req.params.id);

        if (result.changes === 0) {
            return res.status(404).json({
                error: 'Record not found!'
            });
        }

        res.json({
            message: 'Record updated successfully!'
        });

    } catch (error) {
        handleError(res, error);
    }
});

// DELETE
app.delete('/api/:type/:id', (req, res) => {
    const t = tables[req.params.type];

    if (!t) {
        return res.status(404).json({
            error: 'Unknown table'
        });
    }

    try {
        const result = db.prepare(
            `DELETE FROM ${t.name}
             WHERE ${t.id} = ?`
        ).run(req.params.id);

        if (result.changes === 0) {
            return res.status(404).json({
                error: 'Record not found!'
            });
        }

        res.json({
            message: 'Record deleted successfully!'
        });

    } catch (error) {
        handleError(res, error);
    }
});

// START SERVER
app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});
