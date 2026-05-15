const { getDB } = require("../db");
const { ObjectId } = require("mongodb");

const Survey = {
  // 创建问卷
  async create(data) {
    const db = getDB();
    const result = await db.collection("surveys").insertOne(data);
    return result;
  },

  // 获取问卷列表（支持分页、筛选）
  async findList({
    author,
    page = 1,
    pageSize = 10,
    isDeleted = false,
    isStar,
  } = {}) {
    const db = getDB();
    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const query = { author, isDeleted };
    if (isStar !== undefined) query.isStar = isStar;

    const list = await db
      .collection("surveys")
      .find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .toArray();

    const total = await db.collection("surveys").countDocuments(query);
    return { list, total };
  },

  // 根据ID查询
  async findById(id) {
    const db = getDB();
    if (typeof id === "string") id = new ObjectId(id);
    return await db.collection("surveys").findOne({ _id: id });
  },

  // 更新问卷
  async update(id, data) {
    const db = getDB();
    if (typeof id === "string") id = new ObjectId(id);
    return await db
      .collection("surveys")
      .updateOne({ _id: id }, { $set: { ...data, updatedAt: new Date() } });
  },

  // 软删除
  async delete(id) {
    const db = getDB();
    if (typeof id === "string") id = new ObjectId(id);
    return await db
      .collection("surveys")
      .updateOne(
        { _id: id },
        { $set: { isDeleted: true, updatedAt: new Date() } },
      );
  },

  // 真正删除
  async deletePermanently(id) {
    const db = getDB();
    if (typeof id === "string") id = new ObjectId(id);
    return await db.collection("surveys").deleteOne({ _id: id });
  },

  // 复制问卷
  async duplicate(id, author) {
    const db = getDB();
    const original = await this.findById(id);
    if (!original) return null;
    const { _id, ...rest } = original;
    return await db.collection("surveys").insertOne({
      ...rest,
      title: rest.title + "（副本）",
      author,
      isPublished: false,
      isStar: false,
      isDeleted: false,
      answerCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  },
};

module.exports = Survey;
