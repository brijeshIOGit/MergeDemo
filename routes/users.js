var express = require('express');
var mysql = require('mysql');
var cookieParser = require('cookie-parser');
var jwt = require('jsonwebtoken');
var session=require('express-session');
var MySQLStore = require('express-mysql-session')(session);

var options = {
    host: 'localhost',// Host name for database connection.
    port: 3308,// Port number for database connection.
    user: 'root',// Database user.
    password: '',// Password for the above database user.
    database: 'node',// Database name.
    checkExpirationInterval: 900000,// How frequently expired sessions will be cleared; milliseconds.
    expiration: 1512671400000,// The maximum age of a valid session; milliseconds.
    createDatabaseTable: true,// Whether or not to create the sessions database table, if one does not already exist.
    connectionLimit: 10,// Number of connections when creating a connection pool
    schema: {
        tableName: 'sessions',
        columnNames: {
            session_id: 'session_id',
            expires: 'expires',
            data: 'data'
        }
    }
};

var connection = mysql.createConnection(options); // or mysql.createPool(options);
var sessionStore = new MySQLStore({}/* session store options */, connection);
var router = express.Router();
router.use(cookieParser());
router.use(session({
    key: 'session_cookie_name',
    secret: 'session_cookie_secret',
    store: sessionStore,
    resave: false,
    saveUninitialized: true,
    cookie: { path: '/', httpOnly: false, secure: false, maxAge: null }
}));
/* GET users listing. */
router.get('/', function(req, res, next) {

  res.send('respond with a resource');
});
router.get('/session', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.send(req.sessionID);
});
router.use('/', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
function fetchID(data, callback) {
    connection.query('SELECT * FROM users WHERE user_email = ?',
        data, function(err, rows) {
            if (err) {
                callback(err, null);
            } else
                callback(null, rows);
        });
}
router.get('/loginVerify',function(req, res, next){

    var token = req.body.token || req.headers["x-access-token"];

    console.log(token);
    if (token) {
        jwt.verify(token, 'secret', function(err, decoded) {
            console.log("in verify");
            if (err) {
                console.log("in error");
                console.error(err);
                return res.status(403).send(err);
            } else {

                req.decoded = decoded;
                res.send("verifies");
            }
        });
    } else {
        res.status(403).send("Token not provided");
    }



});
router.post('/login',function(req, res, next){
    /*res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();*/
    var useraDetails={
        email:req.body.email,
        password:req.body.password
    };
    console.log("token is");
    fetchID(useraDetails.email,function(err,user){
        console.log("content length is /");
        console.log(user);
        if (err) {
            console.log(err);

            // Do something with your error...
        } else {
            if(user.length>0){
                var myToken = jwt.sign({ user: user[0].user_id },
                    'secret',
                    { expiresIn: 24 * 60 * 60 });
                res.send(200, {'token': myToken,
                    'userId':    user[0].user_id,
                    'username': user[0].user_name });
            }
            else{
                var data= {
                    success: false,
                    msg: "user not found"

                };
                res.json({"data":data});
            }

        }

    });


    /*res.send(req.session);
    return;*/
    /*if(req.session && req.session.user){
        res.json([{"from session":true},{"session is":req.session},{"sessionID is":req.sessionID},{"user is":req.session.user}])
    }

    else{
        console.log("in else");
        fetchID(useraDetails.email,function(err,content){
            console.log("content length is /");
            console.log(content.length);
            if (err) {
                console.log(err);

                // Do something with your error...
            } else {
                if(content.length>0){
                    req.session.user=content;
                    console.log(session);
                    res.json([{"from db":true},{"session is":req.session},{"sessionID is":req.sessionID},{"user is":req.session.user}])

                }
                else{
                    var data= {
                        success: false,
                        msg: "user not found"

                    }
                    res.json({"data":data});
                }

                console.log(content);
                 res.send(content);

            }

        });
    }
*/

});
router.post('/register', function(req, res, next) {
    var useraDetails={
        name:req.body.name,
        email:req.body.email,
        contact:req.body.contact,
        password:req.body.password
    };
    var name=req.body.name;
    var email=req.body.email;
    var password=req.body.password;
    var contact=req.body.contact;

    fetchID(email,function(err,content){
        if (err) {
            console.log(err);

            // Do something with your error...
        } else {
            console.log(content.length);
            if(content.length==0){
                insertUser(useraDetails,function(err,user){
                    console.log("user details are")
                    console.log(useraDetails);
                    if (err) {
                        console.log(err);
                        res.send(err);
                        // Do something with your error...
                    } else {
                        fetchID(useraDetails.email,function(err,userData){

                            console.log("Sdfdsf");
                            console.log(userData[0].user_id);
                            var myToken = jwt.sign({ user: userData[0].user_id },
                                'secret',
                                { expiresIn: 24 * 60 * 60 });
                            res.send(200, {'token': myToken,
                                'userId':    userData[0].user_id,
                                'username': userData[0].user_name });
                        })

                    }
                });
            }
            else {
                res.status(404).json('Username already exist!');
            }

            /*console.log(content);
            res.send("user  is -" + content);*/
        }

    });

    function insertUser(data,callback){
        var values = {
            user_name:data.name, user_email:data.email,user_contact:data.contact,user_password:data.password

        };
        connection.query('INSERT INTO users SET ?',
            values, function(err, rows) {
                console.log("from user table");
                console.log(rows);
                if (err) {
                    callback(err, null);
                } else
                    callback(null, rows);
            });
    }




});

module.exports = router;
