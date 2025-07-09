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
            source.content = md.markdownToHtml(source.content);
            source.toc = md.getTOC(source.content);
            console.log(source.toc)
            let data = [
                source.user_id || 1,
                source.content || '',
                source.title || '',
                source.display_title || '',
                source.status || '1',
                source.toc || []
            ];
            // res.json(data);
            // return;
            const postId = db.blogs.createPost(...data);
            res.json({
                message: 'Post created successfully',
                data: data,
                postId: postId,
                url: `/blog/${source.user_id || 1}/${postId}`
            });
        });
    }
}
module.exports = (app, _config_) => {new Endpoints(app, _config_);};