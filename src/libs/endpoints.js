const api = require('./apiendpoints');
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

        // api endpoints
        api(this.app, this.config);
    }
}
module.exports = (app, _config_) => {new Endpoints(app, _config_);};