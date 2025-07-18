const { performance } = require('perf_hooks');
const db = require('./db');
const md = require('./md');
const api = new class API{
    constructor(){
        this.init();
    }
    init(){
        
    }
}();
class Endpoints{
    constructor(app,_config_){
        this.app = app;
        this.config = _config_;
        this.init();
    }
    init(){
        console.log('Registering API endpoints...');
        // user management endpoints
        this.app.post('/signin',(req,res)=>{
            // Merge req.body and req.query to support both JSON and form-data
            const formData = { ...req.query, ...req.body };
            const { username, password } = formData;

            let data = db.users.login(username,password)
            if (!data) {
                return res.status(401).json({ message: 'Invalid username or password' });
            }
            let age = 1000 // one second
            age *= 60 // one minute
            age *= 60 // one hour
            age *= 24 // one day
            age *= 7 // one week
            res.cookie('token',data.token,{
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: age
            })
            res.json({ message: 'Login successful', user: data.username });
        })
        console.log('Signin endpoint registered at POST /signin');

        // misc endpoints
        this.app.get('/api/v1/ping', (req, res) => {
            const start = performance.now();
            const end = performance.now();
            const delay = Math.round(end - start);
            res.json({
                message: 'pong',
                delay: `${delay}ms`
            });
        });
        this.app.post('/api/v1/post', (req, res) => {
            // Merge req.body and req.query to support both body and query/form-data
            const source = { ...req.query, ...req.body };
            
            // Get the original markdown content for TOC generation
            const originalContent = source.content || '';
            
            // Generate enhanced HTML and TOC from original markdown
            const enhanced = md.getEnhancedHtml(originalContent);
            
            let data = [
                source.user_id || 1,
                enhanced.html, // Use enhanced HTML
                source.title || '',
                source.display_title || '',
                source.status || '1',
                enhanced.headers // Use the headers array for TOC storage
            ];
            
            console.log('TOC Headers:', enhanced.headers);
            
            const postId = db.blogs.createPost(...data);
            res.json({
                message: 'Post created successfully',
                data: data,
                postId: postId,
                url: `/blog/${source.user_id || 1}/${postId}`
            });
        });
        this.app.post('/api/v1/user', (req, res) => {
            try {
                // Check for admin token
                const token = req.cookies.token;
                if (!token) {
                    return res.status(401).json({ message: 'Authentication required' });
                }
                
                const user = db.users.getUserByToken(token);
                if (!user) {
                    return res.status(401).json({ message: 'Invalid token' });
                }
                
                // Check if user has admin permissions
                const userPermissions = JSON.parse(user.permissions);
                if (!userPermissions.includes('admin')) {
                    return res.status(403).json({ message: 'Admin access required' });
                }
                
                // Merge req.body and req.query to support both body and query/form-data
                const source = { ...req.query, ...req.body };
                
                // Validate required fields
                if (!source.username || !source.password || !source.email) {
                    return res.status(400).json({ 
                        message: 'Missing required fields: username, password, and email are required' 
                    });
                }
                
                // Parse permissions if provided as string, otherwise default to ['user']
                let permissions = ['user'];
                if (source.permissions) {
                    try {
                        permissions = typeof source.permissions === 'string' 
                            ? JSON.parse(source.permissions) 
                            : source.permissions;
                    } catch (e) {
                        return res.status(400).json({ message: 'Invalid permissions format' });
                    }
                }
                
                // Create user with provided data
                db.users.createUser(
                    source.username,
                    source.password,
                    source.email,
                    'default.png', // profile_picture
                    '', // bio
                    parseInt(source.status) || 0, // is_active
                    permissions,
                    source.display_name || source.username // display_name
                );
                
                res.json({
                    message: 'User created successfully',
                    user: {
                        username: source.username,
                        email: source.email,
                        permissions: permissions,
                        status: parseInt(source.status) || 0
                    }
                });
                
            } catch (error) {
                console.error('Error creating user:', error);
                res.status(500).json({ 
                    message: 'Internal server error',
                    error: error.message 
                });
            }
        });
    }
}
module.exports = (app, _config_) => {new Endpoints(app, _config_);};