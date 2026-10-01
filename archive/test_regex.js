const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync(':memory:');
db.exec('CREATE TABLE T (id INTEGER PRIMARY KEY);');
const stmt = db.prepare('INSERT OR IGNORE INTO T (id) VALUES (?)');
const r1 = stmt.run(1);
const r2 = stmt.run(1);
console.log('r1:', r1);
console.log('r2:', r2);
