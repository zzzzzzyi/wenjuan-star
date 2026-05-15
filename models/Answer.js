const { getDB } = require("../db");
const { ObjectId } = require("mongodb");

const Answer = {
  // 提交答卷
  async create(answerData) {
    const db = getDB();
    return await db.collection("answers").insertOne(answerData);
  },

  // 获取问卷的答卷列表（分页）
  async findBySurveyId(surveyId, page = 1, pageSize = 10) {
    const db = getDB();
    const skip = (page - 1) * pageSize;
    const list = await db
      .collection("answers")
      .find({ surveyId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .toArray();
    const total = await db.collection("answers").countDocuments({ surveyId });
    return { list, total };
  },

  // 获取答卷总数
  async countBySurveyId(surveyId) {
    const db = getDB();
    return await db.collection("answers").countDocuments({ surveyId });
  },

  // 获取组件统计结果
  async getComponentStats(surveyId, componentFeId) {
    const db = getDB();
    const stats = await db
      .collection("answers")
      .aggregate([
        { $match: { surveyId } },
        { $unwind: "$answers" },
        { $match: { "answers.fe_id": componentFeId } },
        { $group: { _id: "$answers.value", count: { $sum: 1 } } },
      ])
      .toArray();
    return stats;
  },
};

module.exports = Answer;
