const fs = require('fs');
const content = fs.readFileSync('src/app/App.tsx', 'utf8');

const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('function ProcessingScreen'));
const end = lines.findIndex((l, i) => i > start && l.startsWith('}')) + 1;

console.log(lines.slice(start, end).join('\n'));
