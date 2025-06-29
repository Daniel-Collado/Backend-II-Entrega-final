
import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import { engine } from 'express-handlebars';
import path from 'path'; 
import cookieParser from 'cookie-parser';
import passport from 'passport';

import initializedPassport from './src/config/passport.config.js';
import config from './src/config/index.js';

import sessionRouter from './src/routes/session.router.js';
import usersRouter from './src/routes/user.router.js';
import productRouter from './src/routes/product.router.js';
import viewsRouter from './src/routes/views.router.js';
import cartRouter from './src/routes/cart.router.js';

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const { PORT, MONGO_URI, SECRET } = config;
const app = express();

// Handlebars
app.engine('hbs', engine({ 
    extname: '.hbs',      
    defaultLayout: 'main', 
    layoutsDir: join(__dirname, 'src', 'views', 'layouts'),
    helpers: {
        ifEquals: function (arg1, arg2, options) {
            return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
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

// Configuración de sesiones
app.use(session({
    secret: SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    }
}));

// Inicializar Passport 
initializedPassport();
app.use(passport.initialize());
app.use(passport.session());

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
app.use('/', viewsRouter);

// Manejo de errores 404 
app.use((req, res, next) => {
    res.status(404).send('Página no encontrada');
});

// Conexión a Mongo
mongoose.connect(`${MONGO_URI}/integrative_practice`)
    .then(() => console.log('Conectado a MongoDB'))
    .catch(err => console.error('Error al conectar a MongoDB:', err));

const serverPort = PORT; 
app.listen(serverPort, () => {
    console.log(`Servidor iniciado en puerto ${serverPort}`);
});