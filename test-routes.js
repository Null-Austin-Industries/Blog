const express = require('express');
const app = express();

// Test each route pattern individually to find the problematic one
try {
    console.log('Testing route: /');
    app.get('/',(req,res)=>{
        res.send('home');
    });
    console.log('✓ / route OK');
    
    console.log('Testing route: /login');
    app.get('/login',(req,res)=>{
        res.send('login');
    });
    console.log('✓ /login route OK');
    
    console.log('Testing route: /curator/*');
    app.get('/curator/*',(req,res,next)=>{
        res.send('curator');
    });
    console.log('✓ /curator/* route OK');
    
    console.log('Testing route: /curator/post');
    app.get('/curator/post',(req,res)=>{
        res.send('curator post');
    });
    console.log('✓ /curator/post route OK');
    
    console.log('Testing route: /admin/*');
    app.get('/admin/*',(req,res,next)=>{
        res.send('admin');
    });
    console.log('✓ /admin/* route OK');
    
    console.log('Testing route: /css/:file');
    app.get('/css/:file',(req,res)=>{
        res.send('css');
    });
    console.log('✓ /css/:file route OK');
    
    console.log('Testing route: /js/:file');
    app.get('/js/:file',(req,res)=>{
        res.send('js');
    });
    console.log('✓ /js/:file route OK');
    
    console.log('Testing route: /blog/:userid/:blogid');
    app.get('/blog/:userid/:blogid', async (req, res, next) => {
        res.send('blog');
    });
    console.log('✓ /blog/:userid/:blogid route OK');
    
    console.log('All routes tested successfully!');
    
} catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
}
