// utils/jwt.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * 生成JWT token
 * @param {Object} payload - 要编码的数据
 * @returns {string} JWT token
 */
const generateToken = (payload) => {
  try {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'entyre-cms',
      audience: 'entyre-users'
    });
  } catch (error) {
    throw new Error('生成token失败');
  }
};

/**
 * 验证JWT token
 * @param {string} token - 要验证的token
 * @returns {Object} 解码后的数据
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'entyre-cms',
      audience: 'entyre-users'
    });
  } catch (error) {
    throw error; // 让调用者处理具体的错误类型
  }
};

/**
 * 解码token（不验证签名，仅用于获取信息）
 * @param {string} token - 要解码的token
 * @returns {Object} 解码后的数据
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    throw new Error('解码token失败');
  }
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken
};