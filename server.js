const express = require('express');
const cookieParser = require('cookie-parser'); //npm install cookie-parser
const bodyParser = require('body-parser'); // npm install body-parser
const token = require('./createtoken'); // 외부 js파일 가져오기
const app = express();
const nunjucks = require('nunjucks');
const ctoken = require('./jwt');
const auth = require('./middleware/auth');
const mysql = require('mysql');
const crypto = require('crypto');
const { User } = require('../TEAMPROJECT/models');

app.set('view engine','html');
nunjucks.configure('views',{
    express:app,
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:false,}))
app.use(cookieParser());
app.use(express.static('public'));

let connection = mysql.createConnection({
    host:'127.0.0.1',
    user:'root',
    password:'1234',
    database:'userpractice'
})

connection.connect();

app.get('/',(req,res)=>{ // main페이지
    let {msg} = req.query;             
    res.render('index')
  
});

app.get('/user/info',auth,(req,res)=>{
    res.send(`Hello ${req.userid}`);
})

app.get('/menu1',(req,res)=>{ //sub 페이지 
    res.send('menu1페이지입니다.');
})

//POST auth/local/login
app.post('/auth/local/login',(req,res)=>{
    let {userid,userpw} = req.body;
    //비번 암호화
    let shapw = crypto.createHmac('sha256',Buffer.from(userpw))
    .digest('base64')
    .replace('=','')
    console.log(userid,shapw);
    let result = {};

    //정보 불러오기
    let sql = `select * from users where userid='${userid}' and userpw='${shapw}';`
    connection.query(sql,(error,results)=>{
        if(error){
            console.log(error)}
        else{
            console.log(results)
            let dbuserid = results[0].userid;
            let dbuserpw = results[0].userpw;
            if(userid==dbuserid && shapw==dbuserpw){
                // 로그인 성공
                result = {
                    result:true,
                    msg:'로그인에 성공하셨습니다.'
                }
        
                let token = ctoken(userid);
                res.cookie('AccessToken',token,{httpOnly:true,secure:true,})
        
                //token 내용을 
            } else {
                // 로그인 실패
                result = {
                    result:false,
                    msg:'아이디와 패스워드를 확인해주세요.'
                }
            }
            res.json(result)
        }
    })
})


app.get('/login',(req,res)=>{
    console.log('get')
    let {id,pw} = req.query; 
    let shapw = crypto.createHmac('sha256',Buffer.from(pw))
    // header.payload
    .digest('base64')
    .replace('=','')
    let sql = `select * from users where userid=${id} and userpw=${shapw};`
    connection.query(sql,(error,results)=>{
        console.log(results)
    })
/*
    if(id=='root' && pw=='root'){
        // 토큰 생성
        let ctoken = token();
        res.cookie('token',ctoken,{httpOnly:true,secure:true,});
        res.redirect('/?msg=로그인성공');
    } else {
        // 토큰 실패
        res.redirect('/?msg=로그인실패');
    }
*/
})

app.get('/join',(req,res)=>{
    res.render('join')
})

app.post('/join',(req,res)=>{
    let id=req.body.user_id;
    let pw=req.body.user_pw;
    let name=req.body.user_name;
    let mail=req.body.user_mail;

    let shapw = crypto.createHmac('sha256',Buffer.from(pw))
    // header.payload
    .digest('base64')
    .replace('=','')
    console.log(shapw)
    let sql=`insert into users (userid, userpw, username, usermail) values ('${id}', '${shapw}','${name}', '${mail}')`
    connection.query(sql,(error,results)=>{
        if(error){
            console.log(error)
        }else{
            console.log(results)
            res.render('index.html')
        }
    });        
})

app.listen(3000,()=>{
    console.log('server start port 3000!');
});