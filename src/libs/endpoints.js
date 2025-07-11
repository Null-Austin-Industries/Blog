const api = require('./apiendpoints');
const path = require('path');
const JSDOM = require('jsdom').JSDOM;
let db = require('./db');
const { read } = require('fs');
const { markdownToHtml, getEnhancedHtml } = require('./md');
class Endpoints{
    constructor(app,_config_, test){
        this.app = app;
        this.config = _config_;
        this.test = test;
        this.init();
    }
    init(){
        // static endpoints
        this.app.get('/',(req,res)=>{
            let mostRecentBlog = db.blogs.getMostRecent();
            let title = mostRecentBlog[0].display_title;
            let id = mostRecentBlog[0].id;
            let uid = mostRecentBlog[0].user_id;

            let _date = new Date(mostRecentBlog[0].created_at);
            _date = _date.getFullYear() + '.' + String(_date.getMonth() + 1).padStart(2, '0') + '.' + String(_date.getDate()).padStart(2, '0');

            let document = new JSDOM(mostRecentBlog[0].content).window.document;

            let link = document.createElement('a');
            link.href = `/blog/${uid}/${id}`;
            link.textContent = title;

            let h2 = document.createElement('h2');
            h2.innerHTML = link.outerHTML;

            let date = document.createElement('span');
            date.textContent = _date;

            let html = h2.outerHTML + '<br>' + date.outerHTML

            res.render(path.join('pages/home.html'),{recent:html});
        })

        this.app.get('/login',(req,res)=>{
            res.sendFile(path.join(__dirname,'../web/pages/login.html'));
        })

        this.app.use('/curator/:a', (req,res,next)=>{
            let token = req.cookies.token;
            if (this.test){
                return next();
            }
            if (!token) {
                return res.redirect('/login');
            }
            let user = db.users.getUserByToken(token);
            if (!user) {
                return res.redirect('/login');
            }
            JSON.parse(user.permissions).includes('curator') ? next() : res.status(403).send('Forbidden');
        })

        this.app.get('/curator/post',(req,res)=>{
            res.sendFile(path.join(__dirname,'../web/pages/post.html'));
        })

        this.app.use('/admin/:a', (req,res,next)=>{
            if (this.test){
                return next();
            }
            let token = req.cookies.token;
            if (!token) {
                return res.redirect('/login');
            }
            let user = db.users.getUserByToken(token);
            if (!user) {
                return res.redirect('/login');
            }
            JSON.parse(user.permissions).includes('admin') ? next() : res.status(403).send('Forbidden');
        })

        this.app.get('/admin/createUser',(req,res)=>{
            res.sendFile(path.join(__dirname,'../web/pages/createUser.html'));
        })

        // dynamic endpoints
        this.app.get('/css/:file',(req,res)=>{
            let css = path.join(__dirname,'../web/css')
            let file = path.join(css,req.params.file)
            if (!file.normalize().startsWith(css.normalize())) {
                return res.status(403).send('Forbidden');
            }
            res.sendFile(file);
        })

        this.app.get('/js/:file',(req,res)=>{
            let js = path.join(__dirname,'../web/js')
            let file = path.join(js,req.params.file)
            if (!file.normalize().startsWith(js.normalize())) {
                return res.status(403).send('Forbidden');
            }
            res.sendFile(file);
        })

        this.app.get('/blog/:userid/:blogid', async (req, res, next) => {
            try {
            const { userid, blogid } = req.params;
            // Fetch blog by blogid
            const blog = await db.blogs.getPostById(blogid);
            // Check if blog exists and belongs to userid
            if (!blog || blog.user_id !== parseInt(userid)) {
                return next()
            }
            // Format date: take only the date part and replace '-' with '.'
            let date = new Date(blog.updated_at); // prolly overcomplicated but whatever
            date = date.getFullYear() + '.' + 
                String(date.getMonth() + 1).padStart(2, '0') + '.' +
                String(date.getDate()).padStart(2, '0');
            let readTime = blog.readTime
            readTime = blog.content.split(' ').length / 200;
            readTime = Math.ceil(readTime);
            
            // Process markdown content and generate TOC
            const enhanced = getEnhancedHtml(blog.content);
            
            res.render(path.join('pages/blog.html'), {
                blog: {
                    title: blog.title,
                    titledesc: blog.display_title,
                    content: enhanced.html,
                    toc: enhanced.toc,
                    date: date,
                    readTime: readTime
                }
            });
            } catch (e) {
            next(e);
            }
        })

        // api endpoints
        console.log('Loading API endpoints...');
        api(this.app, this.config);
        console.log('API endpoints loaded.');
        
        // 404 handler - must be last
        this.app.use((req,res,next)=>{
            res.status(404).send('Not Found');
        });
    }
}
module.exports = (app, _config_) => {new Endpoints(app, _config_);};