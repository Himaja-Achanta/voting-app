const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const db = new sqlite3.Database('database.db');

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Create table with a PRIMARY KEY on 'option' and UNIQUE constraint
db.run(`
  CREATE TABLE IF NOT EXISTS votes (
    option TEXT PRIMARY KEY,
    count INTEGER
  )
`);

// Endpoint to handle votes
app.post('/vote', (req, res) => {
  const { vote } = req.body;

  // Insert vote or update count
  db.run(
    `INSERT INTO votes (option, count)
     VALUES (?, 1)
     ON CONFLICT(option)
     DO UPDATE SET count = count + 1`,
    [vote],
    err => {
      if (err) {
        console.error('Error while inserting vote:', err);
        return res.status(500).send('Error inserting vote');
      }
      res.sendStatus(200);
    }
  );
});

// Endpoint to get results
app.get('/results', (req, res) => {
  db.all(`SELECT option, SUM(count) as count FROM votes GROUP BY option`, [], (err, rows) => {
    if (err) {
      console.error('Error fetching results:', err);
      return res.status(500).send('Error fetching results');
    }
    res.json(rows);
  });
});

// Serve results page
app.get('/results-page', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'results.html'));
});

// Endpoint to serve the voting page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
