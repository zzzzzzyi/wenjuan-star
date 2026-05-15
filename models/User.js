const { getDB } = require("../db");

const User = {
  // 创建用户
  async create(userData) {
    const db = getDB();
    const result = await db.collection("users").insertOne(userData);
    return result;
  },

  // 根据用户名查找
  async findByUsername(username) {
    const db = getDB();
    return await db.collection("users").findOne({ username });
  },

  // 根据 ID 查找
  async findById(id) {
    const db = getDB();
    const { ObjectId } = require('mongodb');
    return await db.collection('users').findOne({ _id: new ObjectId(id) });
  },

  // 获取所有用户（分页）
  async findAll(page = 1, pageSize = 10) {
    const db = getDB();
    const skip = (page - 1) * pageSize;
    const users = await db
      .collection("users")
      .find({}, { projection: { password: 0 } }) // 不返回密码
      .skip(skip)
      .limit(pageSize)
      .toArray();
    const total = await db.collection("users").countDocuments();
    return { list: users, total };
  },
};

module.exports = User;
