// Main db module
const sqlite3  = require('better-sqlite3');

// Node.js Modules
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');

// Configuration
const ini = require('ini');
const _config_ = ini.parse(fs.readFileSync(path.join(__dirname,'../config/general.ini'), 'utf-8'));

class Database{
    constructor(init = true){
        this.db = new sqlite3(path.join(__dirname,'../',_config_.database.directory))
        if (init) this.init();
    }
    init(){
        // User's
        this.db.prepare(`CREATE TABLE IF NOT EXISTS ${_config_.database.userTable} (
            id INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            email TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP DEFAULT NULL,
            permissions TEXT DEFAULT '["user"]',
            profile_picture TEXT DEFAULT 'default.png',
            bio TEXT DEFAULT '',
            is_active INTEGER DEFAULT 0,
            posts TEXT DEFAULT '[]',
            followers TEXT DEFAULT '[]',
            following TEXT DEFAULT '[]',
            settings TEXT DEFAULT '{}',
            notifications TEXT DEFAULT '[]',
            display_name TEXT DEFAULT '',
            status INTEGER DEFAULT 1,
            status_reason TEXT DEFAULT null,
            ips TEXT DEFAULT '[]',
            token TEXT DEFAULT NULL
        );`).run();
        // Posts
        this.db.prepare(`CREATE TABLE IF NOT EXISTS ${_config_.database.blogsTable} (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL DEFAULT -1,
            content TEXT NOT NULL DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'published',
            FOREIGN KEY (user_id) REFERENCES ${_config_.database.userTable}(id)
        );`).run();
    }
    users = new class {
        constructor(database) {
            this.database = database;
        }
        randomToken(length=128){
            return crypto.randomBytes(length).toString('hex');
        }
        createUser(username,password,email = null,profile_picture = 'default.png',bio = '',is_active = 0,permissions = ['user'],display_name = ''){
            this.database.db.prepare(`INSERT INTO ${_config_.database.userTable} (username,password,email,profile_picture,bio,is_active,permissions,display_name) VALUES (?,?,?,?,?,?,?,?)`).run(username,password,email,profile_picture,bio,is_active,JSON.stringify(permissions),display_name);
        }
        getUserById(id){
            return this.database.db.prepare(`SELECT * FROM ${_config_.database.userTable} WHERE id = ?`).get(id);
        }
        modifyUser(id,updates){
            const set = Object.keys(updates).map(key => `${key} = ?`).join(', ');
            this.database.db.prepare(`UPDATE ${_config_.database.userTable} SET ${set} WHERE id = ?`).run(...Object.values(updates), id);
        }
        getAllUsers(){
            return this.database.db.prepare(`SELECT * FROM ${_config_.database.userTable}`).all();
        }
        blacklistUser(id,reason){
            this.database.db.prepare(`UPDATE ${_config_.database.userTable} SET status = 'blacklisted', status_reason = ? WHERE id = ?`).run(reason, id);
        }
        getUser(username){
            return this.database.db.prepare(`SELECT * FROM ${_config_.database.userTable} WHERE username = ?`).get(username);
        }
        login(username,password){
            let user = this.getUser(username);
            if (!user) return null;
            if (user.password !== password) return null;
            let newData = {};
            newData['token'] = this.randomToken();
            newData['last_login'] = new Date().toISOString();
            this.modifyUser(user.id, newData);
            return { ...user, ...newData };
        }
    }(this)
    blogs = new class {
        constructor(database) {
            this.database = database;
        }
        createPost(user_id, content, status = 'published') {
            this.database.db.prepare(
                `INSERT INTO ${_config_.database.blogsTable} (user_id, content, status) VALUES (?, ?, ?)`
            ).run(user_id, content, status);
        }
        getPostById(id) {
            return this.database.db.prepare(
                `SELECT * FROM ${_config_.database.blogsTable} WHERE id = ?`
            ).get(id);
        }
        getAllPosts() {
            return this.database.db.prepare(
                `SELECT * FROM ${_config_.database.blogsTable}`
            ).all();
        }
        getPostsByUser(user_id) {
            return this.database.db.prepare(
                `SELECT * FROM ${_config_.database.blogsTable} WHERE user_id = ?`
            ).all(user_id);
        }
        updatePost(id, updates) {
            const set = Object.keys(updates).map(key => `${key} = ?`).join(', ');
            this.database.db.prepare(
                `UPDATE ${_config_.database.blogsTable} SET ${set}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
            ).run(...Object.values(updates), id);
        }
        deletePost(id) {
            this.database.db.prepare(
                `DELETE FROM ${_config_.database.blogsTable} WHERE id = ?`
            ).run(id);
        }
    }(this)
}

module.exports = new Database();