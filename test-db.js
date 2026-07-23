const Database = require('better-sqlite3');
const db = new Database(':memory:');
console.log('better-sqlite3 works fine in Node!', db.prepare('select 1+1 as res').get());
