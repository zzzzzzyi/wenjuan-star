const url = require("url");
const Answer = require("../models/Answer");
const Survey = require("../models/Survey");
const { ObjectId } = require("mongodb");
const { getDB } = require("../db");

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

const answerRoutes = {
  // POST /api/answer 提交答卷
  async submit(req, res) {
    const data = await parseBody(req);
    const answer = {
      surveyId: data.surveyId,
      answers: data.answers || [],
      createdAt: new Date(),
    };
    const result = await Answer.create(answer);

    // 增加问卷的 answerCount
    await Survey.update(data.surveyId, { answerCount: 1 }, true); // 第三个参数表示增量

    res.end(
      JSON.stringify({ errno: 0, data: { id: result.insertedId.toString() } }),
    );
  },

  // GET /api/answer/:questionId 获取答卷列表
  async getList(req, res, params) {
    const surveyId = params[1];
    const query = url.parse(req.url, true).query;
    const page = parseInt(query.page) || 1;
    const pageSize = parseInt(query.pageSize) || 10;
    const result = await Answer.findBySurveyId(surveyId, page, pageSize);
    res.end(JSON.stringify({ errno: 0, data: result }));
  },

  // GET /api/answer/:questionId/stat/:componentFeId 组件统计数据
  async getComponentStats(req, res, params) {
    const surveyId = params[1];
    const componentFeId = params[3];
    const stats = await Answer.getComponentStats(surveyId, componentFeId);
    res.end(JSON.stringify({ errno: 0, data: stats }));
  },
};

// 修改 Survey.update 支持增量更新
Survey.update = async function (id, data, isIncrement = false) {
  const db = getDB();
  if (typeof id === "string") id = new ObjectId(id);

  if (isIncrement) {
    return await db
      .collection("surveys")
      .updateOne({ _id: id }, { $inc: { answerCount: data.answerCount } });
  }

  return await db
    .collection("surveys")
    .updateOne({ _id: id }, { $set: { ...data, updatedAt: new Date() } });
};

module.exports = answerRoutes;
