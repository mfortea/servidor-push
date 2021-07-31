// index.js - Backend del servidor

// Requires
require('dotenv').config();
const Koa = require('koa');
const router = require('koa-router');
const body = require('koa-body');
const Pug = require('koa-pug');
const serve = require('koa-static');
const webpush = require('web-push');
const path = require('path');
const mariadb = require('mariadb');
const app = new Koa();
const _ = router();


// Credenciales de la base de datos
const pool = mariadb.createPool({
     host: process.env.HOST,
     database: process.env.DATABASE, 
     user: process.env.USER_DB, 
     password: process.env.PASSWORD,
     connectionLimit: process.env.CONNECTION_LIMIT
});


// Claves VAPID
const vapidKeys = {
    publicKey: process.env.PUBLIC_KEY,
    privateKey: process.env.PRIVATE_KEY
};
webpush.setVapidDetails(
    'mailto:'+process.env.EMAIL_VAPID,
    vapidKeys.publicKey,
    vapidKeys.privateKey
);


// Enrutamiento estático
app.use(serve('./imagenes'));
app.use(serve('./css'));
app.use(serve('assets'));
app.use(body());


// Configuración de las vistas de Pug
const pug = new Pug({
    viewPath: path.resolve(__dirname, './views'),
    basedir: './views',
    app: app
});


// ***** ENDPOINTS ***** //

// GET (/)
_.get('/', async ctx => {
    return ctx.render('index');
});


// POST (/subscribe)
_.post('/subscribe', async ctx => {
    const { sub } = ctx.request.body;
    try {
        conn = await pool.getConnection();
        const res = await conn.query("INSERT INTO usuarios value (?, ?, ?)", [sub.endpoint, sub.keys.p256dh, sub.keys.auth]);
        console.log(res);
        conn.end();
    } catch (e) {
        console.log(e);
    }

    ctx.body = 'ok';
});


// POST (/)
var clientes = [];
_.post('/', async ctx => {
  const { title, body, icon, badge, action_url, action_title, action_icon } = ctx.request.body;

  try {
    conn = await pool.getConnection();
    const filas = await conn.query('SELECT * FROM usuarios')
    var keys = [];
    filas.forEach((fila) => {
        clientes.push({endpoint: fila.endpoint, keys: {  p256dh: fila.p256dh,  auth: fila.auth } });
    })
    conn.end();
    console.log(clientes);
    clientes.forEach(subItem => {
      webpush.sendNotification(subItem, JSON.stringify({ title, body, icon, badge, action_url, action_title, action_icon }));
    });
  } catch (e) {
    console.log(e);
  }

  return ctx.render('index');
});


// ***** DESPLIEGUE ***** //
app.use(_.routes());
app.listen(8081, () => {
  console.log('listen: ' + 8081);
});

