import { handler } from './build/handler.js';
import { createServer } from 'http';

const port = process.env.PORT || 5173;
const host = process.env.HOST || '0.0.0.0';

console.log(`Starting server on ${host}:${port}`);

const server = createServer(handler);

server.listen(port, host, () => {
  console.log(`Server running on http://${host}:${port}`);
});
