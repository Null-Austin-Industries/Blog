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
            let data = [
                source.user_id || 1,
                md(source.content) || '',
                source.display_title || '',
                source.title || '',
                source.status || '1'
            ];
            // res.json(data);
            // return;
            db.blogs.createPost(...data);
            res.json({
                message: 'Post created successfully',
                data: data
            });
        });
    }
}
module.exports = (app, _config_) => {new Endpoints(app, _config_);};