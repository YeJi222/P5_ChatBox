var mysql = require('mysql');
var db = mysql.createConnection({
    host:'localhost',
    user:'root2',
    password:'1q2w3e8255',
    database:'chatBox_DB'
});
db.connect();
module.exports = db;