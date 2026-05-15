const url = require("url");
const User = require("../models/User");
const crypto = require("crypto");

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
    req.on("error", reject);
  });
}

function getUserIdFromToken(req) {
  const token = req.headers["authorization"]?.replace("Bearer ", "");
  console.log("token:", token);

  if (!token) return null;

  const userId = token.replace("token_", "");

  console.log("userId:", userId);

  return userId;
}

const userRoutes = {
  // POST /api/user/register
  async register(req, res) {
    const { username, password, nickname } = await parseBody(req);
    const existing = await User.findByUsername(username);
    if (existing) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ errno: 1, msg: "用户名已存在" }));
      return;
    }
    const md5Pwd = crypto.createHash("md5").update(password).digest("hex");
    await User.create({
      username,
      password: md5Pwd,
      nickname: nickname || username,
      avatar: "",
      createdAt: new Date(),
    });
    res.end(JSON.stringify({ errno: 0, data: { id: "new_user_id" } }));
  },

  // POST /api/user/login
  async login(req, res) {
    const { username, password } = await parseBody(req);
    const md5Pwd = crypto.createHash("md5").update(password).digest("hex");
    const user = await User.findByUsername(username);
    if (!user || user.password !== md5Pwd) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ errno: 1, msg: "用户名或密码错误" }));
      return;
    }
    res.end(
      JSON.stringify({
        errno: 0,
        data: { token: "token_" + user._id.toString() },
      }),
    );
  },

  // GET /api/user/info
  async getInfo(req, res) {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ errno: 1, msg: "未登录" }));
      return;
    }
    const user = await User.findById(userId);
    if (!user) {
      res.end(JSON.stringify({ errno: 1, msg: "用户不存在" }));
      return;
    }
    res.end(
      JSON.stringify({
        errno: 0,
        data: {
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar,
        },
      }),
    );
  },
};

module.exports = userRoutes;
