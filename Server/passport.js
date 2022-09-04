var db = require('./db');
var alert = require('alert');

module.exports = function(app){
    // passport는 session을 내부적으로 사용하기 때문에 express-session을
    // 활성화시키는 코드 다음에 사용해야 한다.
    var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;

    app.use(function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, X-AUTHENTICATION, X-IP, Content-Type, Accept');
        res.header('Access-Control-Allow-Credentials', true);
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        next();
    });

    app.use(passport.initialize()); // app.use() : express에 미들웨어를 설치하는 것
    app.use(passport.session()); // passport는 내부적으로 session에 쓰겠다

    // 로그인을 성공했다는 사실을 session store에 저장하는 기능을 하는 것
    // 로그인에 성공하면 딱 한 번 호출
    passport.serializeUser(function(user, done){
        console.log('serializeUser', user);
        done(null, user.admin_id);
    });

    // 로그인이 됐을 때, 리로드할 때마다 호출되게 약속되어 있음
    passport.deserializeUser(function(admin_id, done){
        console.log('deserializeUser', admin_id);
        db.query('SELECT * FROM admin_user WHERE admin_id=?' , 
            [admin_id], function (err, result) {
            if(err) throw err;    
            done(null, result[0]);
        })   
    });

    passport.use(new LocalStrategy(
    {
        usernameField: 'id',
        passwordField: 'pw',
    },
    function(id, password, done) {
        console.log('LocalStrategy');
        console.log(id, password);
        db.query(`SELECT * FROM admin_user WHERE admin_id=? AND admin_pw=?` , 
        [id, password], function (err, result) {
            if(err) throw err;
            // alert('passport');

            // 입력받은 ID와 비밀번호에 일치하는 회원정보가 없는 경우   
            if(result.length === 0){
                console.log("Admin 회원 정보가 틀렸습니다. 다시 로그인해주세요 :)");
                return done(null, false, { message: 'Incorrect User Info.' });
            } else{ // 회원정보가 맞을 때
                console.log("admin id: " + result[0].admin_id);
                return done(null, result[0], {
                    message: 'Welcome.'
                });  // result값으로 받아진 회원정보를 return해줌
            }
        });
        }
    ));

    return passport;
}