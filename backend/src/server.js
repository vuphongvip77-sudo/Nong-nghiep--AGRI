import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const DB_PATH = path.join(ROOT, "data", "db.json");

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "127.0.0.1";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "ChangeMe123!";

const sessions = new Map();

function readDb() {
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, expected] = String(stored).split(":");
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expected, "hex");
  return expectedBuffer.length === actual.length &&
    crypto.timingSafeEqual(actual, expectedBuffer);
}

function ensureAdmin() {
  const db = readDb();
  if (!db.users.some(u => u.username === ADMIN_USERNAME)) {
    db.users.push({
      id: `user-${crypto.randomUUID()}`,
      name: "Quản trị AGRI",
      username: ADMIN_USERNAME,
      passwordHash: hashPassword(ADMIN_PASSWORD),
      role: "admin",
      active: true,
      mustChangePassword: true,
      createdAt: new Date().toISOString()
    });
    writeDb(db);
    console.log(`Đã tạo tài khoản quản trị mặc định: ${ADMIN_USERNAME}`);
  }
}

function send(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": CORS_ORIGIN,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
  });
  res.end(body);
}

function getToken(req) {
  const value = req.headers.authorization || "";
  return value.startsWith("Bearer ") ? value.slice(7) : "";
}

function currentUser(req) {
  const token = getToken(req);
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) return null;
  const db = readDb();
  return db.users.find(u => u.id === session.userId) || null;
}

function requireAuth(req, res) {
  const user = currentUser(req);
  if (!user) {
    send(res, 401, { error: "Chưa đăng nhập hoặc phiên đã hết hạn." });
    return null;
  }
  return user;
}

function requireAdmin(req, res) {
  const user = requireAuth(req, res);
  if (!user) return null;
  if (user.role !== "admin") {
    send(res, 403, { error: "Chỉ quản trị viên được phép thực hiện." });
    return null;
  }
  return user;
}

function logAction(action, user) {
  const db = readDb();
  db.logs.unshift({
    id: `log-${crypto.randomUUID()}`,
    time: new Date().toISOString(),
    userId: user?.id || null,
    username: user?.username || "system",
    action
  });
  db.logs = db.logs.slice(0, 2000);
  writeDb(db);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function publicUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

ensureAdmin();

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return send(res, 204, {});
  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (req.method === "GET" && url.pathname === "/api/health") {
      return send(res, 200, {
        ok: true,
        service: "AGRI Platform Backend",
        version: "7.1.0",
        time: new Date().toISOString()
      });
    }

    if (req.method === "POST" && url.pathname === "/api/auth/login") {
      const { username, password } = await readBody(req);
      const db = readDb();
      const user = db.users.find(u => u.username === username && u.active);
      if (!user || !verifyPassword(password, user.passwordHash)) {
        return send(res, 401, { error: "Sai tên đăng nhập hoặc mật khẩu." });
      }
      const token = crypto.randomBytes(32).toString("hex");
      sessions.set(token, {
        userId: user.id,
        expiresAt: Date.now() + 8 * 60 * 60 * 1000
      });
      logAction("Đăng nhập", user);
      return send(res, 200, { token, user: publicUser(user) });
    }

    if (req.method === "POST" && url.pathname === "/api/auth/logout") {
      const token = getToken(req);
      const user = currentUser(req);
      sessions.delete(token);
      if (user) logAction("Đăng xuất", user);
      return send(res, 200, { ok: true });
    }

    if (req.method === "GET" && url.pathname === "/api/me") {
      const user = requireAuth(req, res);
      if (!user) return;
      return send(res, 200, { user: publicUser(user) });
    }

    if (req.method === "GET" && url.pathname === "/api/users") {
      if (!requireAdmin(req, res)) return;
      const db = readDb();
      return send(res, 200, { items: db.users.map(publicUser) });
    }

    if (req.method === "POST" && url.pathname === "/api/users") {
      const admin = requireAdmin(req, res);
      if (!admin) return;
      const body = await readBody(req);
      if (!body.name || !body.username || !body.password) {
        return send(res, 400, { error: "Thiếu họ tên, tên đăng nhập hoặc mật khẩu." });
      }
      const db = readDb();
      if (db.users.some(u => u.username === body.username)) {
        return send(res, 409, { error: "Tên đăng nhập đã tồn tại." });
      }
      const user = {
        id: `user-${crypto.randomUUID()}`,
        name: body.name,
        username: body.username,
        email: body.email || "",
        passwordHash: hashPassword(body.password),
        role: body.role || "viewer",
        active: body.active !== false,
        mustChangePassword: true,
        createdAt: new Date().toISOString()
      };
      db.users.push(user);
      writeDb(db);
      logAction(`Tạo người dùng ${user.username}`, admin);
      return send(res, 201, { user: publicUser(user) });
    }

    if (req.method === "GET" && url.pathname === "/api/logs") {
      if (!requireAdmin(req, res)) return;
      const db = readDb();
      return send(res, 200, { items: db.logs });
    }

    if (req.method === "GET" && url.pathname === "/api/backup") {
      if (!requireAdmin(req, res)) return;
      return send(res, 200, {
        version: "7.1",
        createdAt: new Date().toISOString(),
        data: readDb()
      });
    }

    return send(res, 404, { error: "Không tìm thấy API." });
  } catch (error) {
    console.error(error);
    return send(res, 500, { error: "Lỗi máy chủ.", detail: error.message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`AGRI Backend đang chạy tại http://${HOST}:${PORT}`);
  console.log("Kiểm tra: /api/health");
});
