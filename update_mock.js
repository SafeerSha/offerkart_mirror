const fs = require('fs');
const file = 'src/lib/api/mockData.ts';
let c = fs.readFileSync(file, 'utf8');
c = c.replace(/validUntil:\s*".*?",/g, 'validFrom: "2026-03-01",\n        validTo: "2026-03-31",');
fs.writeFileSync(file, c);
console.log("Replaced validUntil with validFrom and validTo");
