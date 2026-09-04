const Database = require('better-sqlite3');
const db = new Database('data/reco.db');
console.log('count:', db.prepare('SELECT COUNT(*) as c FROM recovery_cases').get().c);
console.log('sum amount:', db.prepare('SELECT SUM(invoice_amount) as s FROM recovery_cases').get().s);
console.log('sum recovered:', db.prepare('SELECT SUM(recovered_amount) as s FROM recovery_cases').get().s);
console.log('Acme:', db.prepare("SELECT status, invoice_amount, recovered_amount FROM recovery_cases WHERE customer_name = 'Acme Technologies'").get());
console.log('DataForge:', db.prepare("SELECT status, invoice_amount, recovered_amount FROM recovery_cases WHERE customer_name = 'DataForge Analytics'").get());
console.log('Exceeds:', db.prepare('SELECT COUNT(*) as c FROM recovery_cases WHERE recovered_amount > invoice_amount').get().c);
