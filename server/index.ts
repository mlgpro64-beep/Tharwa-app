import express, { type Request, Response, NextFunction } from "express";
import { router } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import session from "express-session";
import createMemoryStore from "memorystore";
import { WebSocketServer } from "ws";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// Session middleware
const MemoryStore = createMemoryStore(session);
app.use(
  session({
    store: new MemoryStore(),
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, sameSite: "lax", maxAge: 24 * 60 * 60 * 1000 },
  })
);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

// WebSocket setup for real-time chat
const wss = new WebSocketServer({ noServer: true });
const connections = new Map<string, Set<any>>();

httpServer.on("upgrade", (req, socket, head) => {
  // Only handle /ws routes for our chat WebSocket
  if (req.url?.startsWith("/ws")) {
    wss.handleUpgrade(req, socket, head, (ws) => {
      const url = new URL(req.url || "", "http://localhost");
      const taskId = url.searchParams.get("taskId");
      
      if (!taskId) {
        ws.close();
        return;
      }
      
      if (!connections.has(taskId)) {
        connections.set(taskId, new Set());
      }
      connections.get(taskId)!.add(ws);
      
      ws.on("message", (data) => {
        try {
          const message = JSON.parse(data.toString());
          const taskConnections = connections.get(taskId);
          if (taskConnections) {
            taskConnections.forEach((client) => {
              if (client.readyState === 1) { // OPEN
                client.send(JSON.stringify({ type: "message", data: message }));
              }
            });
          }
        } catch (error) {
          console.error("WebSocket message error:", error);
        }
      });
      
      ws.on("close", () => {
        const taskConnections = connections.get(taskId);
        if (taskConnections) {
          taskConnections.delete(ws);
        }
      });
    });
  }
  // Other upgrade requests are handled by Vite automatically
});

(async () => {
  app.use(router);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
