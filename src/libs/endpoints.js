const api = require('./apiendpoints');
const path = require('path');
let db = require('./db');
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
            const blog = await db.getBlogById(blogid);
            // Check if blog exists and belongs to userid
            if (!blog || blog.userid !== userid) {
                return next()
            }
            res.render(path.join('pages/blog.html'), {
                blog: {
                title: blog.title,
                titledesc: blog.titledesc,
                content: blog.content,
                date: blog.date,
                readTime: blog.readTime
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