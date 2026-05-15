const http = require("http");
const url = require("url");
const { connectDB } = require("./db");
const userRoutes = require("./routes/user");
const surveyRoutes = require("./routes/survey");
const answerRoutes = require("./routes/answer");

const PORT = 3001;

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;

  try {
    // ===== 用户接口 =====
    if (path === "/api/user/register" && req.method === "POST") {
      return await userRoutes.register(req, res);
    }
    if (path === "/api/user/login" && req.method === "POST") {
      return await userRoutes.login(req, res);
    }
    if (path === "/api/user/info" && req.method === "GET") {
      return await userRoutes.getInfo(req, res);
    }

    // ===== 问卷接口 =====
    if (path === "/api/question" && req.method === "POST") {
      return await surveyRoutes.create(req, res);
    }
    if (path === "/api/question" && req.method === "GET") {
      return await surveyRoutes.getList(req, res);
    }
    if (path === "/api/question" && req.method === "DELETE") {
      return await surveyRoutes.batchDelete(req, res);
    }
    // POST /api/question/duplicate/:id
    if (
      /^\/api\/question\/duplicate\/(.+)$/.test(path) &&
      req.method === "POST"
    ) {
      const m = path.match(/^\/api\/question\/duplicate\/(.+)$/);
      return await surveyRoutes.duplicate(req, res, m);
    }
    // GET /api/question/:id
    if (/^\/api\/question\/([a-f0-9]+)$/i.test(path) && req.method === "GET") {
      const m = path.match(/^\/api\/question\/([a-f0-9]+)$/i);
      return await surveyRoutes.getDetail(req, res, m);
    }
    // PATCH /api/question/:id
    if (
      /^\/api\/question\/([a-f0-9]+)$/i.test(path) &&
      req.method === "PATCH"
    ) {
      const m = path.match(/^\/api\/question\/([a-f0-9]+)$/i);
      return await surveyRoutes.update(req, res, m);
    }
    // DELETE /api/question/:id
    if (
      /^\/api\/question\/([a-f0-9]+)$/i.test(path) &&
      req.method === "DELETE"
    ) {
      const m = path.match(/^\/api\/question\/([a-f0-9]+)$/i);
      return await surveyRoutes.delete(req, res, m);
    }

    // ===== 答案/统计接口 =====
    if (path === "/api/answer" && req.method === "POST") {
      return await answerRoutes.submit(req, res);
    }
    // GET /api/answer/:questionId/stat/:componentFeId  组件统计
    if (
      /^\/api\/answer\/([a-f0-9]+)\/stat\/(.+)$/i.test(path) &&
      req.method === "GET"
    ) {
      const m = path.match(/^\/api\/answer\/([a-f0-9]+)\/stat\/(.+)$/i);
      return await answerRoutes.getComponentStats(req, res, m);
    }
    // GET /api/answer/:questionId
    if (/^\/api\/answer\/([a-f0-9]+)$/i.test(path) && req.method === "GET") {
      const m = path.match(/^\/api\/answer\/([a-f0-9]+)$/i);
      return await answerRoutes.getList(req, res, m);
    }

    // 404
    res.writeHead(404);
    res.end(JSON.stringify({ errno: 1, msg: "接口不存在" }));
  } catch (err) {
    console.error("❌ 服务器错误:", err);
    res.writeHead(500);
    res.end(
      JSON.stringify({ errno: 1, msg: "服务器内部错误: " + err.message }),
    );
  }
});

async function start() {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`🚀 服务已启动: http://localhost:${PORT}`);
  });
}

start();
