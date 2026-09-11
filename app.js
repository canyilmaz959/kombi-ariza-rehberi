const express = require('express');
const path = require('path');
const mon = require("mongoose");
const routesRoutes = require("./routes/routes");
const session = require('express-session');

require('dotenv').config({ path: './.env' });

const app = express();

app.set('trust proxy', process.env.TRUST_PROXY === 'true');

// Session ayarları
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: 'ariza.sid',
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60
  }
}));


// MongoDB bağlantısı
async function startServer() {
  try{
    await mon.connect(process.env.DB_URI, {
    });
    console.log("MongoDB bağlantısı başarılı");


    app.listen(3000, () => {
      console.log('3000 portlu server çalıştı ( http://127.0.0.1:3000 )');
    });


  }catch(err){
      console.error("MongoDB bağlantısı hatası:", err);
    }
}



//ejs ayarları
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));


app.use("/", routesRoutes);




// server'ı başlat
startServer();