// Super-duper cool blog :D
// Enjoy :tongue:

// ------------------------------------
// Modules
// ------------------------------------

// Express Related Modules
const express = require('express');
const cookieParser = require('cookie-parser');
const ini = require('ini');

// Node.js Modules
const path = require('node:path');
const fs = require('node:fs');

// Third-party Modules (that are not express related)
const TermColor = require('term-color');

// Local Modules
const endpoints = require('./libs/endpoints');

// ------------------------------------
// Configuration
// ------------------------------------

const _config_ = new class{
    constructor() {
        this._path = path.join(__dirname,'config');
        this.general = ini.parse(path.join(this._path,'general.ini'));
    }
}()

// ------------------------------------
// Backend
// ------------------------------------

// Setting up the backend
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.set('views', path.join(__dirname, 'web'));

// pass the app via the endpoints module
endpoints(app, _config_);

// set up listening
const port = _config_.general.port || 3000
app.listen(port, (e) => {
    if (e) {
        console.error(TermColor.red(e));
        process.exit(1);
    } else{
        console.log(TermColor.green(`Server is running on port ${port}\nhttp://localhost:${port}`));
    }
})

// Set up script closing
process.on('SIGINT', () => {
    console.warn(TermColor.yellow('\nctrl+c received, shutting down the server...'));
    process.exit(0);
});