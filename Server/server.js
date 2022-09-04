var express = require('express');
var app = express();
var path = require('path');
var db = require('./db');
var bodyParser = require('body-parser');
var compression = require('compression');
var session = require('express-session');
var flash = require('connect-flash');
var alert = require('alert');
var nodemailer = require("nodemailer");

app.listen(8080, function(){
    console.log('Listening on port 8080!');
});

app.use(express.json());
var cors = require('cors');
app.use(cors({origin: "http://localhost:3000", credentials:true}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(compression());
app.use(session({
  secret: 'sfdfsfedf', // 필수적으로 들어가야 하는 부분
  resave: false,
  saveUninitialized: true,
  // store: new FileStore() // 주석처리해야 flash memory가 잘 뜸
}))
app.use(flash()); 

var passport = require('./passport')(app);
// var authRouter = require('./auth')(passport);

// 특정 폴더의 파일들 전송
app.use(express.static(path.join(__dirname, '../client/build')));

// 메인 페이지로 접속했을 때, 해당 파일을 보내달라는 의미
app.get('/', function(request, response){
    response.sendFile(path.join(__dirname, '../client/build/index.html'));
})

app.post('/admin_process', 
    passport.authenticate('local', {
        // successRedirect: '/success', // 성공했을 때
        failureRedirect: '/fail', // 로그인 실패했을 때
    }), 
    
    function(request, response){
        console.log('admin process');
        console.log(request.user);
        response.send('aa');
        // response.redirect('/success');
        // response.send('http://localhost:3000/');
    }
);

// app.post('/logout', function(request, response){ // 로그아웃
//     request.logout(function(err){
//         request.session.save(function(){
//             response.redirect('/');
//         });
//     });
// });

// app.get('/success', function(request, response){
//     console.log('success function');
//     response.redirect('http://localhost:3000/');
// });

// app.post('/success', function(request, response){
//     console.log('success function');
//     response.redirect('http://localhost:3000/');
// });

// app.get('/fail', function(request, response){
//     console.log('fail function');
//     response.redirect('/');
// });

// DB data를 보내주고 싶으면, DB 데이터를 뽑아서 보내주는 API 작성 -> 리액트는 여기로 GET 요쳥
app.post('/login_process', function(request, response){
    // console.log('id: ', request.query.id, 'pw: ', request.query.pw);
    var flag = 0;
    var id = "";
    var pw = "";
    
    // var login_state = "";
    db.query(`SELECT * FROM admin_user`, function(err, admin){
        // console.log(admin[0].admin_id, admin[0].admin_pw);
        console.log(request.body.params.id);
        // if(admin[0].admin_id == request.query.id && admin[0].admin_pw == request.query.pw){

        for(var i = 0 ; i < admin.length ; i++){
            if(admin[i].admin_id === request.body.params.id && admin[i].admin_pw === request.body.params.pw){
                id = request.body.params.id;
                pw = request.body.params.pw;
                flag = 1;
                break;
            }
        }

        if(flag === 1){
            console.log('로그인 성공');
            response.send({login_state : "로그인 성공", id:id, pw:pw})
        } else{
            console.log('로그인 실패');
            response.send({login_state : "로그인 실패"});
        }

        
        // if(admin[0].admin_id === request.body.params.id && admin[0].admin_pw === request.body.params.pw){
        //     // login_state = "로그인 성공";
        //     console.log('로그인 성공');
        //     // response.send({login_state : "로그인 성공"});
        //     response.send({login_state : "로그인 성공", id:admin[0].admin_id, pw:admin[0].admin_pw})
        // } else{
        //     // login_state = "로그인 실패";
        //     console.log('로그인 실패');
        //     response.send({login_state : "로그인 실패"});
        // }

    });

    // response.send({login_state : login_state}); // object나 array 자료를 유저에게 그대로 보내주고 싶을 때
});

app.get('/get_codeList', function(request, response){
    // console.log(request.query.view_user);
    db.query(`SELECT * FROM room WHERE view_user=?`, [request.query.view_user], function(err, room){
        var roomItem = {
            list:[]
        };

        for(var i = 0 ; i < room.length ; i++){
            // roomItem.title.push(room[i].title);
            // roomItem.role.push(room[i].role);

            roomItem.list.push({title: room[i].title, role: room[i].role, code: room[i].code, nickname: room[i].nickName, roomId: room[i].roomId});
        }
        response.send({obj : roomItem});
    });
    
    // response.send({login_state : login_state}); // object나 array 자료를 유저에게 그대로 보내주고 싶을 때
});

app.get('/get_roomList', function(request, response){
    // console.log(request.query.code);
    db.query(`SELECT * FROM room WHERE code=? AND roomId <> '0'`, [request.query.code], function(err, room){
        db.query(`SELECT * FROM room WHERE code=? AND roomId = '0'`, [request.query.code], function(err, roomAdmin){
            // console.log(roomAdmin[0].nickName);
            var roomItem = {
                list:[]
            };

            for(var i = 0 ; i < room.length ; i++){
                // roomItem.title.push(room[i].title);
                // roomItem.role.push(room[i].role);

                roomItem.list.push({roomId: room[i].roomId, title: room[i].title, role: room[i].role, code: room[i].code, nickname: roomAdmin[0].nickName});
            }
            response.send({obj : roomItem});
        });
    });
    
    // response.send({login_state : login_state}); // object나 array 자료를 유저에게 그대로 보내주고 싶을 때
});

function rand_code(code_list, len){ // len: 랜덤 숫자 만들 개수
    var temp = 0;
    var min = 1000000000000;
    var max = 9999999999999;

    for(var i = 0; i < len ; i++){
      temp = Math.floor(Math.random() * (max - min)) + min;
      if(code_list.indexOf(temp) === -1){ // 특정 index를 못찾을 때(중복이 없을 때)
        code_list.push(temp); // 중복 없는 랜덤 숫자를 배열에 push
      } else{
        i--;
      }
    }
  
    return code_list;
}

function roomid_check(arr){
    console.log(arr.length);
    var id = 1;
    for(var i = 0; i < arr.length; i++){
      if(Number(arr[0].roomId) > 1){ // 첫번째 항목의 room id가 1보다 크면 
        id = 1; // 1로 다시 세팅
        break;
      }
      if(i + 1 < arr.length){ // 중간중간 빈 부분 세팅해주기
        if(Number(arr[i+1].roomId) - Number(arr[i].roomdD) > 1 ){
          id = Number(arr[i].roomId) + 1; // arr[i].roomID 다음 번호로 세팅
          break;
        }
      }
      else if(i === arr.length - 1){ // 마지막 항목의 경우
        id += Number(arr[i].roomId); // 마지막 번호에 id(1) 추가
      }
    };
    // console.log(id);

    return id;
}

app.get('/enter_code', function(request, response){
    db.query(`SELECT * FROM room WHERE code=? AND roomId='0'`, [request.query.code] ,function (err, room) {
        for(var i = 0 ; i < room.length ; i++){
            console.log('enter code user: ', room[i].view_user);

            // let email = '21900806@handong.ac.kr';
            let email = room[i].view_user;
            let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'hhongyizi@gmail.com',  // gmail 계정 아이디를 입력
                    pass: 'uiuvljgtaqrnfdlq'          // gmail 계정의 비밀번호를 입력
                }
                });
            
                let mailOptions = {
                from: 'hhongyizi@gmail.com',    // 발송 메일 주소 (위에서 작성한 gmail 계정 아이디)
                to: email ,                     // 수신 메일 주소
                subject: '채팅방 추가 알림 메일 :)', // 제목
                text: '누군가가 채팅을 시작했습니다! 확인해보세요!'  // 내용
                };
            
                transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                    console.log(error);
                }
                else {
                    console.log('Email sent: ' + info.response);
                }
            });
        }
    });

    // console.log('enter_code');
    // console.log('code: ', request.query.code);
    
    db.query(`SELECT * FROM room WHERE code=?`, [request.query.code] ,function (err, room) {
        // console.log(room.length);
        var roomId = roomid_check(room);
        console.log('roomId: ', roomId);

        if(room.length === 0){
            alert('코드를 다시 확인 해주세요:)');
        } else{
            db.query(`SELECT * FROM room WHERE title=? AND view_user=?`, [room[0].title, request.query.view_user] ,function (err, room2) {
                // console.log(room[0].title, request.query.view_user);
                // console.log(room2.length);
                if(room2.length === 0){
                    db.query(`INSERT INTO room (roomId, code, title, role, nickName, view_user) VALUES(?, ?, ?, '사용자', '익명', ?)`, 
                        [roomId, request.query.code, room[0].title, request.query.view_user], function(err3, result){
                            response.send({msg: '채팅방 추가 완료!'});
                    });
                } else{
                    response.send({msg: '본인이 관리자이거나, 이미 추가한 방입니다!'});
                }
            });

            // db.query(`INSERT INTO room (roomId, code, title, role, nickName, view_user) VALUES(?, ?, ?, '사용자', '익명', ?)`, 
            //     [roomId, request.query.code, room[0].title, request.query.view_user], function(err3, result){
            //         response.send({flag: 0});
            // });

            // response.send({roomId: roomId});
        }
        // response.send({random_code : random_code[code_len].toString(36), roomId : roomId});
        
    });
});

app.get('/complain', function(request, response){ // 사용자 입장에서 신고
    console.log(request.query.code, request.query.writer, request.query.roomId);
    db.query(`SELECT * FROM chatting WHERE code=? AND roomId=? AND writer<>?`, [request.query.code, request.query.roomId, request.query.writer], function(err, chat){
        for(var i = 0 ; i < chat.length ; i++){
            console.log(chat[i].content_me);
            db.query(`INSERT INTO complain_table (roomId, code, writer, content) VALUES(?, ?, ?, ?)`, 
                [request.query.roomId, request.query.code, chat[i].writer, chat[i].content_me], function(err2, result){
                    response.send({msg: '신고하였습니다!'});
                });
        }
    });
});

app.get('/plus_code', function(request, response){
    // console.log('plus_code');
    db.query(`SELECT * FROM room` ,function (err, room) {
        // var roomId = roomid_check(room);

        var random_code = [];
        var code_len = 0;
        // db.query(`SELECT * FROM room`, function(err2, room){
            code_len = Number(room.length); // 추가 전, 기존 code 개수들
            for(var i = 0; i < room.length; i++){
                random_code.push(room[i].code);
            }
            random_code = rand_code(random_code, 1); // 1: 랜덤하게 생성할 개수
            console.log(random_code);

            // db.query(`INSERT INTO room (roomId, code) VALUES(?, ?)`, [roomId, random_code[code_len]], function(err3, result){
                response.send({random_code : random_code[code_len].toString(36)});
            // });
    });
});

app.get('/create_room', function(request, response){
    // console.log('roomId: ', request.query.roomId);
    // db.query(`INSERT INTO room (roomId, code, title, role, nickName, view_user) VALUES(?, ?, ?, '관리자', ?, ?)`, 
    //     [request.query.roomId, request.query.code, request.query.title, request.query.nickname, request.query.view_user], function(err3, result){
    //         response.send({flag: 0});
    // });

    // 코드만 생성할 땐, roomId 값 0
    db.query(`INSERT INTO room (roomId, code, title, role, nickName, view_user) VALUES('0', ?, ?, '관리자', ?, ?)`, 
        [request.query.code, request.query.title, request.query.nickname, request.query.view_user], function(err3, result){
            response.send({flag: 0});
    });


    // db.query(`SELECT * FROM room` ,function (err, room) {
    //     // console.log(room.length);
    //     var roomId = roomid_check(room);
    //     console.log('roomId: ', roomId);

    //     var random_code = [];
    //     var code_len = 0;
    //     // db.query(`SELECT * FROM room`, function(err2, room){
    //         code_len = Number(room.length); // 추가 전, 기존 code 개수들
    //         for(var i = 0; i < room.length; i++){
    //             random_code.push(room[i].code);
    //         }
    //         random_code = rand_code(random_code, 1); // 1: 랜덤하게 생성할 개수
    //         console.log(random_code);

    //         // db.query(`INSERT INTO room (roomId, code) VALUES(?, ?)`, [roomId, random_code[code_len]], function(err3, result){
    //             response.send({random_code : random_code[code_len], roomId : roomId});
    //         // });
    // });

});

app.get('/delete_room', function(request, response){
    console.log('delete process');
    console.log(request.query.roomId);
    db.query(`DELETE FROM room WHERE roomId=? AND code=?`, [request.query.roomId, request.query.code], function(err, result){
        db.query(`DELETE FROM chatting WHERE roomId=? AND code=?`, [request.query.roomId, request.query.code], function(err, result){
            response.send({msg: '채팅방과 채팅 내역이 모두 삭제되었습니다!'});
        });
        // response.send({msg: '채팅방이 삭제되었습니다!'});
    });
});

// app.get('/exit_room', function(request, response){
//     // console.log('delete process');
//     console.log(request.query.roomId);
//     db.query(`DELETE FROM room WHERE roomId=? AND code=?`, [request.query.roomId, request.query.code], function(err, result){
//         db.query(`DELETE FROM chatting WHERE roomId=? AND code=?`, [request.query.roomId, request.query.code], function(err, result){
//             response.send({msg: '채팅방과 채팅 내역이 모두 삭제되었습니다!'});
//         });
//         // response.send({msg: '채팅방이 삭제되었습니다!'});
//     });
// });

app.get('/delete_code', function(request, response){
    console.log('delete code');
    console.log(request.query.code);
    db.query(`DELETE FROM room WHERE code=?`, [request.query.code], function(err, result){
        db.query(`DELETE FROM chatting WHERE code=?`, [request.query.code], function(err, result){
            response.send({msg: '코드가 삭제되었습니다!'});
        });
        // response.send({msg: '채팅방이 삭제되었습니다!'});
    });
});

app.get('/addMember', function(request, response){
    // console.log(request.query.code, request.query.title, request.query.nickname, request.query.view_user);
    console.log(request.query.view_user);
    db.query(`SELECT * FROM room WHERE code=? AND role='사용자' AND view_user <> ?`, [request.query.code, request.query.view_user], function(err, room){
        console.log(room.length);
        if(room.length !== 0){
            let email = request.query.view_user;
            let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'hhongyizi@gmail.com',  // gmail 계정 아이디를 입력
                    pass: 'uiuvljgtaqrnfdlq'          // gmail 계정의 비밀번호를 입력
                }
                });
            
                let mailOptions = {
                from: 'hhongyizi@gmail.com',    // 발송 메일 주소 (위에서 작성한 gmail 계정 아이디)
                to: email ,                     // 수신 메일 주소
                subject: '채팅방 공동 권한 초대 알림 메일 :)', // 제목
                text: `'${request.query.title}' 채팅방의 공동 권한을 부여 받았습니다! 확인해보세요!`  // 내용
                };
            
                transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                    console.log(error);
                }
                else {
                    console.log('Email sent: ' + info.response);
                }
            });

            db.query(`INSERT INTO room (roomId, code, title, role, nickName, view_user) VALUES('0', ?, ?, '관리자', ?, ?)`, 
                [request.query.code, request.query.title, request.query.nickname, request.query.view_user], function(err3, result){
                    response.send({msg: '멤버를 추가하였습니다!'});
            });

        } else{ // 사용자로 채팅방에 속해 있으면 
            response.send({msg: '이 계정은 해당 채팅방의 사용자로 등록되어 있습니다. 다시 확인해주세요!'});
        }
    });
    // response.send({msg: '이 계정은 해당 채팅방의 사용자로 등록되어 있습니다. 다시 확인해주세요!'});

    // let email = request.query.view_user;
    // let transporter = nodemailer.createTransport({
    //     service: 'gmail',
    //     auth: {
    //         user: 'hhongyizi@gmail.com',  // gmail 계정 아이디를 입력
    //         pass: 'uiuvljgtaqrnfdlq'          // gmail 계정의 비밀번호를 입력
    //     }
    //     });
    
    //     let mailOptions = {
    //     from: 'hhongyizi@gmail.com',    // 발송 메일 주소 (위에서 작성한 gmail 계정 아이디)
    //     to: email ,                     // 수신 메일 주소
    //     subject: '채팅방 공동 권한 초대 알림 메일 :)', // 제목
    //     text: `'${request.query.title}' 채팅방의 공동 권한을 부여 받았습니다! 확인해보세요!`  // 내용
    //     };
    
    //     transporter.sendMail(mailOptions, function(error, info){
    //     if (error) {
    //         console.log(error);
    //     }
    //     else {
    //         console.log('Email sent: ' + info.response);
    //     }
    // });

    // db.query(`INSERT INTO room (roomId, code, title, role, nickName, view_user) VALUES('0', ?, ?, '관리자', ?, ?)`, 
    //     [request.query.code, request.query.title, request.query.nickname, request.query.view_user], function(err3, result){
    //         response.send({msg: '멤버를 추가하였습니다!'});
    // });

});

app.get('/get_chat', function(request, response){
    db.query(`SELECT * FROM chatting WHERE code=? AND roomId=? ORDER BY time DESC`, [request.query.code, request.query.roomId], function(err2, chat){
        var chatText = {
            list:[]
        };

        for(var i = 0 ; i < chat.length ; i++){
            // roomItem.title.push(room[i].title);
            // roomItem.role.push(room[i].role);
            // console.log(chat[i].writer);

            chatText.list.push({content_me: chat[i].content_me, me: chat[i].me, writer:chat[i].writer});
        }
        response.send({obj : chatText});
    });
});

app.get('/send_chat_process', function(request, response){
    console.log('send_chat_process');

    db.query(`INSERT INTO chatting (roomId, code, content_me, me, writer) VALUES(?, ?, ?, ?, ?)`, 
        [request.query.roomId, request.query.code, request.query.send_text, request.query.nickname, request.query.writer], function(err, result){
            response.send(result);
    });

    // // 사용자 입장
    // db.query(`INSERT INTO chatting (code, other, content_other, content_me, me) VALUES(?, ?, ?, '', '')`, 
    //     [request.query.code, request.query.send_text, request.query.nickname], function(err, result){
    //         response.send(result);
            
    // });
});



// react router 쓰는 경우, 최하단에 추가
app.get('*', function(request, response){
    response.sendFile(path.join(__dirname, '../client/build/index.html'));
})