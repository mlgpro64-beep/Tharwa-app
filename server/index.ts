import 'dotenv/config';
import fs from 'fs';
import path from 'path';
const logPath = path.join(process.cwd(), '.cursor', 'debug.log');
// #region agent log
try { 
  const logDir = path.dirname(logPath);
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  fs.appendFileSync(logPath, JSON.stringify({location:'server/index.ts:7',message:'Server index.ts loading',data:{hasDatabaseUrl:!!process.env.DATABASE_URL,nodeEnv:process.env.NODE_ENV},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n'); 
} catch {}
// #endregion
import express, { type Request, Response, NextFunction } from "express";
// #region agent log
try { fs.appendFileSync(logPath, JSON.stringify({location:'server/index.ts:8',message:'About to import routes',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n'); } catch {}
// #endregion
import { router } from "./routes";
// #region agent log
try { fs.appendFileSync(logPath, JSON.stringify({location:'server/index.ts:10',message:'Routes imported successfully',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n'); } catch {}
// #endregion
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

const isDevelopment = process.env.NODE_ENV === 'development';

// CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Get allowed origins from environment or use defaults
  const productionDomain = process.env.RAILWAY_PUBLIC_DOMAIN || process.env.PUBLIC_DOMAIN;
  const allowedOrigins: string[] = [];
  
  // In production, allow the Railway domain
  if (productionDomain && !isDevelopment) {
    allowedOrigins.push(`https://${productionDomain}`);
    allowedOrigins.push(`http://${productionDomain}`);
  }
  
  // In development, allow localhost origins
  if (isDevelopment) {
    allowedOrigins.push(
    'capacitor://localhost',
    'ionic://localhost',
    'http://localhost',
    'http://localhost:5000',
    'http://localhost:5173',
      'https://localhost'
    );
  }
  
  // Always allow null origin (for Capacitor iOS/file://)
  allowedOrigins.push('null');
  
  // #region agent log
  try { fs.appendFileSync(logPath, JSON.stringify({location:'server/index.ts:36',message:'CORS check',data:{origin,isAllowed:allowedOrigins.includes(origin||''),productionDomain,isDevelopment},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n'); } catch {}
  // #endregion
  
  // Set CORS headers
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin || origin === 'null') {
    // Allow requests with no origin (like from Capacitor iOS)
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (productionDomain && origin?.includes(productionDomain)) {
    // Allow subdomains or variations of production domain
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (origin && origin.includes('tharwwa.com')) {
    // Explicitly allow tharwwa.com
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

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
app.set('trust proxy', 1);
// #region agent log
try { fs.appendFileSync(logPath, JSON.stringify({location:'server/index.ts:67',message:'Session config',data:{isDevelopment,secure:!isDevelopment},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})+'\n'); } catch {}
// #endregion
app.use(
  session({
    store: new MemoryStore({ checkPeriod: 86400000 }),
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: { 
      secure: !isDevelopment, 
      httpOnly: true, 
      sameSite: isDevelopment ? "lax" : "none", 
      maxAge: 24 * 60 * 60 * 1000 
    },
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
  // #region agent log
  try { 
    const logPath = path.join(process.cwd(), '.cursor', 'debug.log');
    const logDir = path.dirname(logPath);
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(logPath, JSON.stringify({location:'server/index.ts:upgrade',message:'WebSocket upgrade request',data:{url:req.url,isViteHmr:req.url?.startsWith('/vite-hmr'),isWs:req.url?.startsWith('/ws')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})+'\n'); 
  } catch {}
  // #endregion
  // Only handle /ws routes for our chat WebSocket - let Vite handle /vite-hmr
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
  // Railway sets PORT automatically, default to 5000 for local development
  // This serves both the API and the client.
  const port = parseInt(process.env.PORT || "5000", 10);
  // In production, always listen on 0.0.0.0 to accept connections from Railway
  // In development on Windows, use localhost for compatibility
  const host = (isDevelopment && process.platform === 'win32') ? 'localhost' : '0.0.0.0';
  httpServer.listen(
    port,
    host,
    () => {
      // #region agent log
      try { 
        const logPath = path.join(process.cwd(), '.cursor', 'debug.log');
        const logDir = path.dirname(logPath);
        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
        fs.appendFileSync(logPath, JSON.stringify({location:'server/index.ts:listen',message:'Server listening',data:{port,host,listening:httpServer.listening},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H5'})+'\n'); 
      } catch {}
      // #endregion
      log(`serving on http://${host}:${port}`);
      if (isDevelopment) {
        log('🔓 Rate limiting DISABLED in development mode');
      } else {
        log('🔒 Rate limiting ENABLED in production mode');
      }
    },
  );
})();
