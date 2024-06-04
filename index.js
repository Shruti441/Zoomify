const express = require("express");
const path = require("path");
const mysql = require('mysql');
const bodyParser = require('body-parser');
const fs = require("fs");
const fileUpload = require("express-fileupload");
const {Pool} = require("pg")

const app = express();
const server = app.listen(3000, function () {
  console.log("Listening on port 3000");
});

const io = require("socket.io")(server, {
  allowEIO3: true, // false by default
});

app.use(express.static(path.join(__dirname, "")));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(fileUpload());

// Create connection to MySQL database
// const db = mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   password: 'root',
//   database: 'zoomify'
// });

const pool = new Pool({
  user: 'default',
  host: 'ep-lucky-voice-a4e08axq-pooler.us-east-1.aws.neon.tech',
  database: 'verceldb',
  password: 'dV6IjHv4uEOy',
  port: 5432,  // default port for PostgreSQL
  ssl: {
    rejectUnauthorized: false  // You can customize this based on your requirements
  }
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to PostgreSQL:', err);
  } else {
    console.log('PostgreSQL connected successfully');
    pool.query("CREATE TABLE if not exists signup (id SERIAL PRIMARY KEY, username VARCHAR(255) NOT NULL unique,email VARCHAR(255) NOT NULL , password VARCHAR(255) NOT NULL, google_id VARCHAR(255) default null);").then(()=>{
console.log("signup table created");
    }).catch((error)=>{
console.log("error signup table" ,error);
    })

    pool.query("CREATE TABLE if not exists logindetails (id SERIAL PRIMARY KEY,email VARCHAR(255) NOT NULL , password VARCHAR(255) NOT NULL);").then(()=>{
      console.log("login details table created");
          }).catch((error)=>{
      console.log("error logindetails table" ,error);
          })
  }
  release();  // Release the client back to the pool
});

// Connect to MySQL
// db.connect((err) => {
//   if (err) {
//     console.error('Error connecting to MySQL:', err);
//     return;
//   }
//   console.log('MySQL connected...');
// });

app.get("/server",(req,res)=>{
  res.json({"msg":"server is running"})
})

// Route to handle sign-up
app.post('/signup', (req, res) => {
  const { username, email, password } = req.body;
  // const sqlInsert = 'INSERT INTO signup (username, email, password) VALUES (?, ?, ?)';
  const sqlInsert = 'INSERT INTO signup (username, email, password) VALUES ($1, $2, $3)';
   pool.query(sqlInsert, [username, email, password], (err, result) => {
    if (err) {
      console.error('Error inserting user into database:', err);
      res.status(500).send('Error inserting user into database');
      return;
    }
    console.log('User inserted into database');
    res.status(200).send('User inserted into database');
  });
});

// Route to handle sign-in
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  // console.log(email+ " " + password);
  // const sqlSelect = 'SELECT * FROM signup WHERE email = ? AND password = ?';
  const sqlSelect = 'SELECT * FROM signup WHERE email = $1 AND password = $2';
  pool.query(sqlSelect, [email, password], (err, results) => {
    if (err) {
      console.error('Error querying database:', err);
      res.status(500).send('Error querying database');
      return;
    }
    // console.log(results)
    if (results.rowCount > 0) {
      // console.log('User authenticated');
      res.status(200).send('User authenticated');
    } else {
      // console.log('Invalid email or password');
      res.status(401).send('Invalid email or password');
    }
  });
});

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client('69134238941-jbal1meq93b3brcvngdbcsrfeng44qsl.apps.googleusercontent.com');

async function verify(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: '69134238941-jbal1meq93b3brcvngdbcsrfeng44qsl.apps.googleusercontent.com',
    });
    const payload = ticket.getPayload();
    return payload;
}

app.post('/google-signin', async (req, res) => {
    const token = req.body.id_token;
    try {
        const payload = await verify(token);
        const { email, name, sub: googleId } = payload;

        // Check if user exists in the database
        // const sqlSelect = 'SELECT * FROM signup WHERE email = ? OR google_id = ?';
        const sqlSelect = 'SELECT * FROM signup WHERE email = $1 OR google_id = $2';
        pool.query(sqlSelect, [email, googleId], (err, results) => {
            if (err) {
                console.error('Error querying database:', err);
                res.status(500).send('Error querying database');
                return;
            }
            if (results.length > 0) {
                // User exists, authenticate
                console.log('User authenticated with Google');
                res.status(200).send('User authenticated with Google');
            } else {
                // User does not exist, register the user
                // const sqlInsert = 'INSERT INTO signup (username, email, google_id) VALUES (?, ?, ?)';
                const sqlInsert = 'INSERT INTO signup (username, email, google_id) VALUES ($1, $2, $3)';
                pool.query(sqlInsert, [name, email, googleId], (err, result) => {
                    if (err) {
                        console.error('Error inserting user into database:', err);
                        res.status(500).send('Error inserting user into database');
                        return;
                    }
                    console.log('User registered with Google');
                    res.status(200).send('User registered with Google');
                });
            }
        });
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(500).send('Error verifying token');
    }
});

var userConnections = [];
io.on("connection", (socket) => {
  console.log("socket id is ", socket.id);
  socket.on("userconnect", (data) => {
    console.log("userconnent", data.displayName, data.meetingid);
    var other_users = userConnections.filter(
      (p) => p.meeting_id == data.meetingid
    );
    userConnections.push({
      connectionId: socket.id,
      user_id: data.displayName,
      meeting_id: data.meetingid,
    });
    var userCount = userConnections.length;
    console.log(userCount);
    other_users.forEach((v) => {
      socket.to(v.connectionId).emit("inform_others_about_me", {
        other_user_id: data.displayName,
        connId: socket.id,
        userNumber: userCount,
      });
    });
    socket.emit("inform_me_about_other_user", other_users);
  });
  socket.on("SDPProcess", (data) => {
    socket.to(data.to_connid).emit("SDPProcess", {
      message: data.message,
      from_connid: socket.id,
    });
  });
  socket.on("sendMessage", (msg) => {
    console.log(msg);
    var mUser = userConnections.find((p) => p.connectionId == socket.id);
    if (mUser) {
      var meetingid = mUser.meeting_id;
      var from = mUser.user_id;
      var list = userConnections.filter((p) => p.meeting_id == meetingid);
      list.forEach((v) => {
        socket.to(v.connectionId).emit("showChatMessage", {
          from: from,
          message: msg,
        });
      });
    }
  });
  socket.on("fileTransferToOther", (msg) => {
    console.log(msg);
    var mUser = userConnections.find((p) => p.connectionId == socket.id);
    if (mUser) {
      var meetingid = mUser.meeting_id;
      var from = mUser.user_id;
      var list = userConnections.filter((p) => p.meeting_id == meetingid);
      list.forEach((v) => {
        socket.to(v.connectionId).emit("showFileMessage", {
          username: msg.username,
          meetingid: msg.meetingid,
          filePath: msg.filePath,
          fileName: msg.fileName,
        });
      });
    }
  });

  socket.on("disconnect", function () {
    console.log("Disconnected");
    var disUser = userConnections.find((p) => p.connectionId == socket.id);
    if (disUser) {
      var meetingid = disUser.meeting_id;
      userConnections = userConnections.filter(
        (p) => p.connectionId != socket.id
      );
      var list = userConnections.filter((p) => p.meeting_id == meetingid);
      list.forEach((v) => {
        var userNumberAfUserLeave = userConnections.length;
        socket.to(v.connectionId).emit("inform_other_about_disconnected_user", {
          connId: socket.id,
          uNumber: userNumberAfUserLeave,
        });
      });
    }
  });

  // HandRaise
  socket.on("sendHandRaise", function (data) {
    var senderID = userConnections.find((p) => p.connectionId == socket.id);
    console.log("senderID :", senderID.meeting_id);
    if (senderID.meeting_id) {
      var meetingid = senderID.meeting_id;
      var list = userConnections.filter((p) => p.meeting_id == meetingid);
      list.forEach((v) => {
        var userNumberAfUserLeave = userConnections.length;
        socket.to(v.connectionId).emit("HandRaise_info_for_others", {
          connId: socket.id,
          handRaise: data,
        });
      });
    }
  });
});

app.post("/attachimg", function (req, res) {
  var data = req.body;
  var imageFile = req.files.zipfile;
  console.log(imageFile);
  var dir = "public/attachment/" + data.meeting_id + "/";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  imageFile.mv(
    "public/attachment/" + data.meeting_id + "/" + imageFile.name,
    function (error) {
      if (error) {
        console.log("couldn't upload the image file , error: ", error);
        res.status(500).send('Error uploading file');
      } else {
        console.log("Image file successfully uploaded");
        res.status(200).send('File uploaded');
      }
    }
  );
});

