const { performance } = require('perf_hooks');
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
    }
}
module.exports = (app, _config_) => {new Endpoints(app, _config_);};