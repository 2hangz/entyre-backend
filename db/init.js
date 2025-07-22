const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'database.db');

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      imageUrl TEXT
    )
  `, (err) => {
    if (err) {
      console.error('Failed to create table:', err.message);
    } else {
      console.log('articles table created or already exists');
    }
  });
});

db.close();
