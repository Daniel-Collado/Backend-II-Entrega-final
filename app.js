import express from 'express';
import connectDB from './src/config/db.js';

import { engine } from 'express-handlebars';
import path from 'path';
import cookieParser from 'cookie-parser';

import { ExtractJwt } from 'passport-jwt';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import moment from 'moment';
import 'moment-timezone';
import 'moment/locale/es';

import initializedPassport from './src/config/passport.config.js';
import config from './src/config/index.js';

import sessionRouter from './src/routes/session.router.js';
import usersRouter from './src/routes/user.router.js';
import productRouter from './src/routes/product.router.js';
import viewsRouter from './src/routes/views.router.js';
import cartRouter from './src/routes/cart.router.js';
import ticketRouter from './src/routes/ticket.router.js';

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const { PORT } = config;
const app = express();

moment.locale('es');

// Handlebars
app.engine('hbs', engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: join(__dirname, 'src', 'views', 'layouts'),
    helpers: {
        ifEquals: function (arg1, arg2, options) {
            return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
        },
        formatDate: function (date) {
            if (!date) return '';
            // Convierte la fecha UTC (de MongoDB) a la zona horaria de Buenos Aires
            const localTime = moment.utc(date).tz('America/Argentina/Buenos_Aires');
            // Formatea la fecha y hora a un formato legible
            return localTime.format('DD [de] MMMM [de] YYYY, HH:mm:ss');
        },
        multiply: function (a, b) {
            return (a * b).toFixed(2);
        },
        calculateCartTotal: function (products) {
            return products.reduce((sum, item) => sum + (item.product.price * item.quantity), 0).toFixed(2);
        }
    }
}));

app.set('views', path.join(__dirname, 'src', 'views'));
app.set('view engine', 'hbs');


// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'src', 'public')));
app.use(cookieParser());

const cookieExtractor = req => {
    let token = null;
    if (req && req.cookies) {
        token = req.cookies['jwtCookie'];
    }
    return token;
};

app.use((req, res, next) => {
    const token = cookieExtractor(req);
    if (token) {
        try {
            const decoded = jwt.verify(token, config.JWT_SECRET);
            req.user = decoded.user; // Establecer req.user si el token es válido
        } catch (err) {
            req.user = null; // Token inválido, dejar req.user como null
        }
    } else {
        req.user = null;
    }
    res.locals.user = req.user || null;
    next();
});

// Inicializar Passport
initializedPassport();
app.use(passport.initialize());

//app.use((req, res, next) => {
//    passport.authenticate('jwt', { session: false }, (err, user, info) => {
//        if (user) {
//            req.user = user;
//        }
//        next();
//    })(req, res, next);
//});

// Pasar datos del user a vistas HBS
app.use((req, res, next) => {
    res.locals.user = req.user || null;
    next();
});


// Rutas
app.use('/api/sessions', sessionRouter);
app.use('/api/users', usersRouter);
app.use('/api/products', productRouter);
app.use('/api/carts', cartRouter);
app.use('/api/tickets', ticketRouter);
app.use('/', viewsRouter);

// Manejo de errores 404
app.use((req, res, next) => {
    res.status(404).send('Página no encontrada');
});

// Iniciar conexión a Mongo y servidor

connectDB().then(() => {
    const serverPort = PORT;
    app.listen(serverPort, () => {
        console.log(`Servidor iniciado en puerto ${serverPort}`);
    });
    }).catch(err => {
    console.error('Error al iniciar el servidor:', err);
});



