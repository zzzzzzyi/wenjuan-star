const url = require("url");
const Survey = require("../models/Survey");
const Answer = require("../models/Answer");
const { ObjectId } = require("mongodb");

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
  if (!token) return "demo_user";
  const userId = token.replace("token_", "");
  return userId;
}

const surveyRoutes = {
  // POST /api/question 创建问卷
  async create(req, res) {
    const data = await parseBody(req);
    const survey = {
      title: data.title || "未命名问卷",
      desc: "",
      js: "",
      css: "",
      isPublished: false,
      isStar: false,
      isDeleted: false,
      answerCount: 0,
      componentList: data.componentList || [],
      author: getUserIdFromToken(req),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await Survey.create(survey);
    res.end(
      JSON.stringify({ errno: 0, data: { id: result.insertedId.toString() } }),
    );
  },

  // GET /api/question 获取问卷列表（支持搜索、分页、筛选）
  // 查询参数: page, pageSize, isDeleted, isStar, keyword
  async getList(req, res) {
    const query = url.parse(req.url, true).query;
    const page = parseInt(query.page) || 1;
    const pageSize = parseInt(query.pageSize) || 10;
    const isDeleted = query.isDeleted === "true";
    const isStar = query.isStar === "true" ? true : undefined;
    const keyword = query.keyword || "";

    const author = getUserIdFromToken(req);
    const result = await Survey.findList({
      author,
      page,
      pageSize,
      isDeleted,
      isStar,
    });

    // 如果有关键词过滤
    if (keyword) {
      result.list = result.list.filter((item) => item.title.includes(keyword));
      result.total = result.list.length;
    }

    res.end(JSON.stringify({ errno: 0, data: result }));
  },

  // GET /api/question/:id 获取问卷详情
  async getDetail(req, res, params) {
    const id = params[1];
    const survey = await Survey.findById(id);
    if (!survey) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ errno: 1, msg: "问卷不存在" }));
      return;
    }
    res.end(JSON.stringify({ errno: 0, data: survey }));
  },

  // PATCH /api/question/:id 更新问卷
  async update(req, res, params) {
    const id = params[1];
    const data = await parseBody(req);
    await Survey.update(id, data);
    res.end(JSON.stringify({ errno: 0, data: {} }));
  },

  // DELETE /api/question/:id 删除问卷（回收站）
  async delete(req, res, params) {
    const id = params[1];
    await Survey.delete(id);
    res.end(JSON.stringify({ errno: 0, data: {} }));
  },

  // POST /api/question/duplicate/:id 复制问卷
  async duplicate(req, res, params) {
    const id = params[1];
    const author = getUserIdFromToken(req);
    const result = await Survey.duplicate(id, author);
    if (!result) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ errno: 1, msg: "问卷不存在" }));
      return;
    }
    res.end(
      JSON.stringify({ errno: 0, data: { id: result.insertedId.toString() } }),
    );
  },

  // DELETE /api/question 批量删除（回收站彻底删除）
  async batchDelete(req, res) {
    const { ids } = await parseBody(req);
    const db = require("../db").getDB();
    const objectIds = ids.map((id) => new ObjectId(id));
    const result = await db
      .collection("surveys")
      .deleteMany({ _id: { $in: objectIds } });
    res.end(
      JSON.stringify({ errno: 0, data: { deleted: result.deletedCount } }),
    );
  },
};

module.exports = surveyRoutes;
