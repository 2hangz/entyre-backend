const bcrypt = require('bcrypt');

const users = [
  {
    id: 1,
    username: 'admin',
    passwordHash: '$2b$10$8K1p5UXVwJQQ8xqvRJLUOeu.Zb5KQD5B1mY3aP4JqG8KZ7c2C3yVa',
    role: 'admin',
    createdAt: new Date(),
    lastLogin: null
  }
];

class User {
  static async findByUsername(username) {
    try {
      // In a real project, this should be a database query
      // const user = await db.query('SELECT * FROM users WHERE username = ?', [username]);
      const user = users.find(u => u.username === username);
      return user || null;
    } catch (error) {
      throw new Error('Failed to find user');
    }
  }

  static async findById(id) {
    try {
      // In a real project, this should be a database query
      // const user = await db.query('SELECT * FROM users WHERE id = ?', [id]);
      const user = users.find(u => u.id === parseInt(id));
      return user || null;
    } catch (error) {
      throw new Error('Failed to find user');
    }
  }

  // Validate password
  static async validatePassword(inputPassword, storedHash) {
    try {
      return await bcrypt.compare(inputPassword, storedHash);
    } catch (error) {
      throw new Error('Password validation failed');
    }
  }

  static async create(userData) {
    try {
      const { username, password, role = 'user' } = userData;
      const existingUser = await this.findByUsername(username);
      if (existingUser) {
        throw new Error('Username already exists');
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const newUser = {
        id: users.length + 1,
        username,
        passwordHash,
        role,
        createdAt: new Date(),
        lastLogin: null
      };

      users.push(newUser);

      const { passwordHash: _, ...userWithoutPassword } = newUser;
      return userWithoutPassword;

    } catch (error) {
      throw error;
    }
  }

  static async updateLastLogin(userId) {
    try {
      const user = users.find(u => u.id === parseInt(userId));
      if (user) {
        user.lastLogin = new Date();
      }
    } catch (error) {
      console.error('Failed to update last login:', error);
    }
  }

  static getSafeUserData(user) {
    const { passwordHash, ...safeData } = user;
    return safeData;
  }
}

module.exports = User;