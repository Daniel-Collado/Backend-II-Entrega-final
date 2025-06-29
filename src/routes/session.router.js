// src/routes/session.router.js
import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import userModel from '../models/user.model.js'; // <-- AÑADIR: Importa tu userModel
import cartModel from '../models/cart.model.js';   // <-- AÑADIR: Importa tu cartModel

// Asegúrate de que JWT_SECRET esté en config/index.js y .env
const { JWT_SECRET } = config;

const router = Router();

// Duración del token y la cookie (hazla consistente)
const TOKEN_EXPIRATION_HOURS = 1; // O 1, según tu preferencia
const COOKIE_MAX_AGE_MS = TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000;


// Ruta de registro
router.post('/register', passport.authenticate('register', {
    session: false,
    failureRedirect: '/failed'
}), async (req, res) => {
    try {
        const userForToken = req.user; // Obtiene el usuario recién creado de Passport

        // Lógica para crear/asociar carrito en el registro
        let userCartId = userForToken.cart;
        if (!userCartId) {
            console.log(`Usuario ${userForToken.email} (registro) no tiene carrito. Creando uno nuevo...`);
            const newCart = await cartModel.create({});
            userForToken.cart = newCart._id; // Asocia el ID del nuevo carrito al usuario en memoria
            await userModel.findByIdAndUpdate(userForToken._id, { cart: newCart._id }); // Guarda en la DB
            userCartId = newCart._id;
            console.log(`Carrito creado y asignado al usuario ${userForToken.email}: ${userCartId}`);
        }

        const token = jwt.sign({
            id: userForToken._id,
            first_name: userForToken.first_name,
            last_name: userForToken.last_name,
            email: userForToken.email,
            role: userForToken.role,
            cart: userCartId // <-- AÑADIR: Incluye el cartId en el payload del JWT
        }, config.JWT_SECRET, { expiresIn: `${TOKEN_EXPIRATION_HOURS}h` }); // Duración consistente

        res.cookie('jwtCookie', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: COOKIE_MAX_AGE_MS // Duración consistente
        });

        res.status(201).json({
            status: "success",
            message: "Registro exitoso",
            user: {
                first_name: userForToken.first_name,
                last_name: userForToken.last_name,
                email: userForToken.email,
                role: userForToken.role,
                cartId: userCartId // Para la respuesta al frontend
            }
        });

    } catch (error) {
        console.error("Error en la ruta de registro después de autenticación:", error);
        res.status(500).json({ status: "error", message: "Error interno del servidor al registrar el usuario." });
    }
});


// Ruta de login
router.post("/login", passport.authenticate("login", {
    failureRedirect: "/failed",
    session: false
}), async (req, res) => {
    try {
        const user = req.user; // Usuario autenticado por Passport

        // Lógica para crear/asociar carrito si no existe
        let userCartId = user.cart; // ID de carrito del usuario de la DB (podría ser null)

        if (!userCartId) {
            console.log(`Usuario ${user.email} (login) no tiene carrito. Creando uno nuevo...`);
            const newCart = await cartModel.create({}); // Crea un carrito vacío
            user.cart = newCart._id; // Asocia el ID del nuevo carrito al user object de Mongoose
            await user.save();       // Guarda el usuario actualizado en la DB con el nuevo cart ID
            userCartId = newCart._id; // Asigna el ID del nuevo carrito para usarlo
            console.log(`Carrito creado y asignado al usuario ${user.email}: ${userCartId}`);
        } else {
            console.log(`Usuario ${user.email} ya tiene carrito: ${userCartId}`);
            // Opcional: Podrías querer verificar si ese cartId realmente existe en la DB
            // y si no, crear uno nuevo. Para simplificar, asumimos que si no es null, es válido.
        }

        const userForToken = { ...user._doc }; // Objeto plano para el token
        delete userForToken.password; // Elimina el password
        userForToken.cart = userCartId; // <-- AÑADIR: Incluye el cartId en el payload del JWT

        const token = jwt.sign({ user: userForToken }, JWT_SECRET, { expiresIn: `${TOKEN_EXPIRATION_HOURS}h` }); // Duración consistente
        res.cookie('jwtCookie', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: COOKIE_MAX_AGE_MS // Duración consistente
        });

        res.redirect("/profile"); // Redirige al perfil o donde desees (ahora con carrito)
    } catch (error) {
        console.error("Error en la ruta de login después de autenticación:", error);
        res.redirect("/failed");
    }
});

// Ruta de logout (sin cambios)
router.post("/logout", (req, res) => {
    res.clearCookie('jwtCookie');
    res.redirect("/login");
});

// Ruta /current (sin cambios, ya debería devolver el cart en req.user si lo pusiste en JWT)
router.get("/current", passport.authenticate('jwt', { session: false }), (req, res) => {
    res.json({ status: "success", user: req.user });
});

// Ruta /restore (sin cambios)
router.post('/restore', async (req, res) => {
    // ... tu código de restore
});

export default router;