// MongoDB initialization script
db = db.getSiblingDB('gomoku_db');

// Create collections
db.createCollection('users');
db.createCollection('games');
db.createCollection('matches');
db.createCollection('rankings');

// Create indexes for performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.games.createIndex({ "created_at": -1 });
db.games.createIndex({ "players": 1 });
db.matches.createIndex({ "game_id": 1 });
db.rankings.createIndex({ "user_id": 1 });
db.rankings.createIndex({ "score": -1 });

// Insert default admin user
db.users.insertOne({
    "_id": ObjectId(),
    "username": "admin",
    "email": "admin@gomoku.com",
    "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewIRpfDR.dUE4iFq", // "admin123"
    "is_admin": true,
    "created_at": new Date(),
    "profile": {
        "name": "Administrator",
        "age": null,
        "location": {
            "city": "",
            "state": "",
            "country": ""
        },
        "avatar_url": ""
    },
    "stats": {
        "games_played": 0,
        "games_won": 0,
        "games_lost": 0,
        "current_score": 0
    },
    "is_active": true
});

print("Database initialized successfully!");
