const setup = require("./db_setup");
const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

const mongoclient = require("mongodb").MongoClient;
const ObjId = require("mongodb").ObjectId;
const url = `mongodb+srv://admin:1234@cluster0.gnyth4u.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

app.use(express.static('public')); 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("view engine", "ejs");


app.listen(process.env.WEB_PORT, async () => {
    await setup();
    console.log("8080 서버가 준비되었습니다...");
});

app.get('/', (req, res) =>{
    //profile(req,res);
    res.render('index.ejs');
})

app.use('/', require('./routes/asset'));

app.get('/contact', (req, res) =>{
    res.render('contact.ejs');
});

app.get('/services', (req, res) =>{
    res.render('services.ejs');
});

app.get('/about', (req, res) =>{
    res.render('about.ejs');
});

app.get('/get-a-quote', (req, res) =>{
    res.render('get-a-quote.ejs');
});

// 회원가입 화면 보기
app.get('/enter', (req, res) => {
    res.render('enter.ejs');
});

let today = new Date();

// 회원가입 처리
app.post("/save", (req, res) => {
    console.log(req.body);
    mydb.collection('account')
        .insertOne({userid: req.body.userid, userpw: req.body.userpw, username: req.body.username})
        .then((result) => {
            console.log('회원가입 성공');
            mydb.collection('asset')
            .insertOne({money: 0, uid: req.body.userid})
            .then((result) => {
                console.log('계좌 생성 성공');
                mydb.collection('assetHistory')
                    .insertOne({
                        amount: 0,
                        type: '계좌 생성',
                        date: today.toLocaleString(),
                        userid: req.body.userid
                });                
                // 테스트용으로 회원가입되면 쿠키 생성되게 함
                res.cookie('uid', req.body.userid);
                res.render('index.ejs');
            });
        });
});

