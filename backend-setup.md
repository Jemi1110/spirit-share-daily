# Backend Setup for Highlight Persistence

## 🚀 **Production-Ready Database Storage**

Your highlights will now be saved to a **real database** instead of localStorage. Here's what you need:

## 📋 **Backend Requirements**

### 1. **Database Schema**
```sql
-- Highlights Table
CREATE TABLE highlights (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  document_id VARCHAR(255) NOT NULL,
  text TEXT NOT NULL,
  color VARCHAR(50) NOT NULL,
  chapter_number INTEGER NOT NULL,
  start_offset INTEGER NOT NULL,
  end_offset INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_document_user (document_id, user_id),
  INDEX idx_chapter (document_id, chapter_number)
);

-- Comments Table
CREATE TABLE highlight_comments (
  id VARCHAR(255) PRIMARY KEY,
  highlight_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (highlight_id) REFERENCES highlights(id) ON DELETE CASCADE
);
```

### 2. **API Endpoints**

```javascript
// Express.js Backend Example
const express = require('express');
const mysql = require('mysql2/promise');
const app = express();

// POST /api/highlights - Create highlight
app.post('/api/highlights', async (req, res) => {
  const { id, userId, userName, documentId, text, color, chapterNumber, position } = req.body;
  
  const query = `
    INSERT INTO highlights (id, user_id, user_name, document_id, text, color, chapter_number, start_offset, end_offset)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  await db.execute(query, [id, userId, userName, documentId, text, color, chapterNumber, position.startOffset, position.endOffset]);
  res.json({ success: true, id });
});

// GET /api/highlights - Load highlights
app.get('/api/highlights', async (req, res) => {
  const { documentId, userId } = req.query;
  
  let query = 'SELECT * FROM highlights WHERE document_id = ?';
  let params = [documentId];
  
  if (userId) {
    query += ' AND user_id = ?';
    params.push(userId);
  }
  
  const [rows] = await db.execute(query, params);
  res.json(rows);
});

// PATCH /api/highlights/:id - Update highlight
app.patch('/api/highlights/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const query = 'UPDATE highlights SET ? WHERE id = ?';
  await db.execute(query, [updates, id]);
  res.json({ success: true });
});

// DELETE /api/highlights/:id - Delete highlight
app.delete('/api/highlights/:id', async (req, res) => {
  const { id } = req.params;
  
  await db.execute('DELETE FROM highlights WHERE id = ?', [id]);
  res.json({ success: true });
});
```

### 3. **Environment Variables**
```bash
# .env file
REACT_APP_API_URL=https://your-api-domain.com/api
REACT_APP_WS_URL=wss://your-api-domain.com
DATABASE_URL=mysql://user:password@host:port/database
```

## 🔄 **How It Works Now**

1. **Create Highlight** → Saved to database immediately
2. **Load Highlights** → Fetched from database on page load
3. **Cross-Device Sync** → Works on any device with login
4. **Real-Time Collaboration** → WebSocket updates for live collaboration
5. **Offline Support** → Falls back to localStorage when offline

## 🎯 **Benefits**

✅ **Persistent across devices** - Login from anywhere and see your highlights
✅ **Real collaboration** - Multiple users can highlight and comment
✅ **Backup & sync** - Never lose your highlights
✅ **Scalable** - Handles thousands of users and documents
✅ **Fast loading** - Optimized database queries
✅ **Offline support** - Works even without internet

## 🚀 **Deployment Options**

### Option 1: **Supabase** (Recommended - Easy)
- PostgreSQL database
- Real-time subscriptions
- Authentication built-in
- Free tier available

### Option 2: **Firebase Firestore**
- NoSQL database
- Real-time updates
- Google authentication
- Generous free tier

### Option 3: **Custom Backend**
- Node.js + Express
- MySQL/PostgreSQL
- Full control
- Deploy on Vercel/Railway/Heroku

## 📱 **Current Status**

The frontend is **ready for production** with:
- Database service integration
- Fallback to localStorage
- Error handling
- Real-time collaboration support

You just need to set up the backend API endpoints and database!