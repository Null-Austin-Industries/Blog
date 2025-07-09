const api = require('./apiendpoints');
const path = require('path');
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

        this.app.get('/blog',(req,res)=>{
            res.render(path.join('pages/blog.html'),{
                blog:{
                    title:"super cool short name",
                    titledesc:"this is a longer form of the title",
                    content:"This is the main content of the blog post.",
                    date:"2025.01.01",
                    readTime:"10"
                }
            });
        })

        // api endpoints
        api(this.app, this.config);
    }
}
module.exports = (app, _config_) => {new Endpoints(app, _config_);};