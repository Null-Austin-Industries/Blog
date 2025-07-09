const api = require('./apiendpoints');
const path = require('path');
let db = require('./db');
const { read } = require('fs');
class Endpoints{
    constructor(app,_config_){
        this.app = app;
        this.config = _config_;
        this.init();
    }
    init(){
        // static endpoints
        this.app.get('/',(req,res)=>{
            res.send('lol')
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
            res.render(path.join('pages/blog.html'), {
                blog: {
                    title: blog.title,
                    titledesc: blog.display_title,
                    content: blog.content,
                    date: date,
                    readTime: readTime
                }
            });
            } catch (e) {
            next(e);
            }
        })

        // api endpoints
        api(this.app, this.config);
        this.app.use((req,res,next)=>{
            res.status(404).send('Not Found');
        });
    }
}
module.exports = (app, _config_) => {new Endpoints(app, _config_);};