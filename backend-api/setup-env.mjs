import fs from 'fs';

const content = `DATABASE_URL="postgresql://usuario:senha@host/banco?sslmode=require"
PORT=3333
`;

fs.writeFileSync('.env', content, 'utf8');
console.log('.env created successfully');
