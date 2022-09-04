var express = require('express');
var router = express.Router();

module.exports = function(passport){
    router.post('/admin_process', 
      passport.authenticate('local', {
        successRedirect: '/home', // 성공했을 때
        failureRedirect: '/', // 로그인 실패했을 때
        failureFlash:true,
        successFlash:true
      }
    ))

    router.get('/admin_process', 
      passport.authenticate('local', {
        successRedirect: '/home', // 성공했을 때
        failureRedirect: '/', // 로그인 실패했을 때
        failureFlash:true,
        successFlash:true
      }
    ))
    
    router.get('/logout', function(request, response){ // 로그아웃
        request.logout(function(err){
            request.session.save(function(){
                response.redirect('/');
            });
        });
    });

    router.post('/logout', function(request, response){
        request.logout(function(err){
            request.session.save(function(){
                response.redirect('/');
            });
        });
    });

    return router;
}