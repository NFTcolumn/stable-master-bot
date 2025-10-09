const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class MemoryManager {
  constructor() {
    this.dbPath = path.join(__dirname, 'conversations.db');
    this.db = new sqlite3.Database(this.dbPath);
    this.initializeDatabase();
  }

  initializeDatabase() {
    this.db.serialize(() => {
      // Create conversations table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS conversations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          chat_id INTEGER NOT NULL,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          edited BOOLEAN DEFAULT FALSE,
          original_content TEXT
        )
      `);

      // Create index for faster queries
      this.db.run(`
        CREATE INDEX IF NOT EXISTS idx_chat_timestamp 
        ON conversations(chat_id, timestamp DESC)
      `);
    });
  }

  async addMessage(chatId, role, content) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO conversations (chat_id, role, content) 
        VALUES (?, ?, ?)
      `);
      
      stmt.run([chatId, role, content], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
      
      stmt.finalize();
    });
  }

  async getRecentHistory(chatId, limit = 20) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT id, role, content, timestamp, edited 
        FROM conversations 
        WHERE chat_id = ? 
        ORDER BY timestamp DESC 
        LIMIT ?
      `;
      
      this.db.all(query, [chatId, limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // Return in chronological order (oldest first)
          resolve(rows.reverse());
        }
      });
    });
  }

  async editResponse(chatId, messageId, newContent) {
    return new Promise((resolve, reject) => {
      // First check if the message exists and belongs to the bot
      const checkQuery = `
        SELECT id, content, role 
        FROM conversations 
        WHERE id = ? AND chat_id = ? AND role = 'assistant'
      `;
      
      this.db.get(checkQuery, [messageId, chatId], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!row) {
          reject(new Error('Message not found or not editable'));
          return;
        }

        // Update the message, keeping original content if not already edited
        const updateQuery = `
          UPDATE conversations 
          SET content = ?, 
              edited = TRUE,
              original_content = CASE 
                WHEN edited = FALSE THEN content 
                ELSE original_content 
              END
          WHERE id = ?
        `;
        
        this.db.run(updateQuery, [newContent, messageId], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes > 0);
          }
        });
      });
    });
  }

  async getEditHistory(chatId, messageId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT id, content, original_content, edited, timestamp
        FROM conversations 
        WHERE id = ? AND chat_id = ?
      `;
      
      this.db.get(query, [messageId, chatId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async clearHistory(chatId) {
    return new Promise((resolve, reject) => {
      const query = `DELETE FROM conversations WHERE chat_id = ?`;
      
      this.db.run(query, [chatId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  async getConversationStats(chatId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as total_messages,
          COUNT(CASE WHEN role = 'user' THEN 1 END) as user_messages,
          COUNT(CASE WHEN role = 'assistant' THEN 1 END) as bot_messages,
          COUNT(CASE WHEN edited = TRUE THEN 1 END) as edited_messages,
          MIN(timestamp) as first_message,
          MAX(timestamp) as last_message
        FROM conversations 
        WHERE chat_id = ?
      `;
      
      this.db.get(query, [chatId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Clean up old conversations (keep last 1000 messages per chat)
  async cleanupOldMessages(chatId, keepCount = 1000) {
    return new Promise((resolve, reject) => {
      const query = `
        DELETE FROM conversations 
        WHERE chat_id = ? AND id NOT IN (
          SELECT id FROM conversations 
          WHERE chat_id = ? 
          ORDER BY timestamp DESC 
          LIMIT ?
        )
      `;
      
      this.db.run(query, [chatId, chatId, keepCount], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  close() {
    this.db.close();
  }
}

module.exports = MemoryManager;