// MongoDB initialization script for production
db = db.getSiblingDB('ai-chatbot');

// Create collections with proper indexes
db.createCollection('users');
db.createCollection('conversations');
db.createCollection('documents');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "createdAt": 1 });

db.conversations.createIndex({ "user": 1 });
db.conversations.createIndex({ "createdAt": -1 });
db.conversations.createIndex({ "updatedAt": -1 });

db.documents.createIndex({ "user": 1 });
db.documents.createIndex({ "filename": 1 });
db.documents.createIndex({ "createdAt": -1 });

print('Database initialized successfully!');
