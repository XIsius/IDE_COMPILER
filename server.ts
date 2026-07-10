import { setupWSConnection } from 'y-websocket/bin/utils';
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { WebSocketServer } from 'ws';
import crypto from 'crypto';

async function startServer() {
  const app = express();
  app.use(express.json());
  
  const PORT = 3000;

  // In-memory mocks
  const users = new Map();
  const sessions = new Set();
  
  app.get("/health", (req, res) => res.json({ status: "ok" }));

  app.post("/register/", (req, res) => {
    const { username, email, password } = req.body;
    users.set(username, { username, email, password });
    res.json({ username, email, status: "Active", provider: "Local" });
  });

  app.post("/login/", (req, res) => {
    const { username } = req.body;
    res.json({ access_token: "mock-token", token_type: "bearer", username });
  });

  app.post("/api/session/create", (req, res) => {
    const session_id = crypto.randomUUID().slice(0, 8);
    sessions.add(session_id);
    res.json({ session_id });
  });

  app.get("/api/session/validate/:session_id", (req, res) => {
    res.json({ valid: true });
  });
  
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // WebSockets multiplexing
  const wssSignaling = new WebSocketServer({ noServer: true });
  const wssExecute = new WebSocketServer({ noServer: true });
  const wssYjs = new WebSocketServer({ noServer: true });
  wssYjs.on('connection', (ws, req) => {
    // Determine room name from url, e.g., /ws/yjs/room-id
    const docName = req.url.split('/ws/yjs/')[1]?.split('?')[0] || 'default';
    setupWSConnection(ws, req, { docName });
  });
  
  wssSignaling.on('connection', (ws, req) => {
    ws.on('message', (msg) => {
        wssSignaling.clients.forEach(client => {
            if (client !== ws && client.readyState === 1) {
                client.send(msg);
            }
        });
    });
  });

  wssExecute.on('connection', (ws, req) => {
    ws.on('message', (msg) => {
      try {
        const payload = JSON.parse(msg.toString());
        setTimeout(() => {
          ws.send(JSON.stringify({
            type: "execution_complete",
            output: `Execution completed successfully in mock mode.\nCode length: ${payload.code?.length ?? 0} chars.`,
            has_error: false
          }));
          
          ws.send(JSON.stringify({
             type: "tutor_message",
             message: "Great job! This is a mock response from the IDE server.",
             emotion: "happy"
          }));
        }, 1000);
      } catch (e) {
          console.error(e);
      }
    });
  });

  server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;

    if (pathname.startsWith('/ws/signaling/')) {
      wssSignaling.handleUpgrade(request, socket, head, (ws) => {
        wssSignaling.emit('connection', ws, request);
      });
    } else if (pathname.startsWith('/ws/execute/')) {
      wssExecute.handleUpgrade(request, socket, head, (ws) => {
        wssExecute.emit('connection', ws, request);
      });
    } else if (pathname.startsWith('/ws/yjs/')) {
      wssYjs.handleUpgrade(request, socket, head, (ws) => {
        wssYjs.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });
}

startServer();
