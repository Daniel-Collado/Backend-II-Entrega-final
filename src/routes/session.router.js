import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import UserService from '../services/UserService.js';
import CartService from '../services/CartService.js';
import UserDTO from '../dtos/UserDTO.js';

const { JWT_SECRET, JWT_EXPIRATION_TIME, JWT_COOKIE_MAX_AGE_MS } = config;

const router = Router();

// Ruta de registro
router.post('/register', passport.authenticate('register', {
    session: false,
    failureRedirect: '/failed'
}), async (req, res) => {
    try {
        const user = req.user;

        let userCartId = user.cart;
        if (!userCartId) {
            console.log(`Usuario ${user.email} (registro) no tiene carrito. Creando uno nuevo...`);
            const newCart = await CartService.createCart();
            user.cart = newCart._id;
            await UserService.updateUserDetails(user._id, { cart: newCart._id });
            userCartId = newCart._id;
            console.log(`Carrito creado y asignado al usuario ${user.email}: ${userCartId}`);
        }

        const userForToken = { ...user._doc };
        delete userForToken.password;
        userForToken.cart = userCartId;

        const token = jwt.sign({ user: userForToken }, JWT_SECRET, { expiresIn: JWT_EXPIRATION_TIME });

        res.cookie('jwtCookie', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: JWT_COOKIE_MAX_AGE_MS
        });

        res.redirect("/profile");

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
        const user = req.user;

        let userCartId = user.cart;

        if (!userCartId) {
            console.log(`Usuario ${user.email} (login) no tiene carrito. Creando uno nuevo...`);
            const newCart = await CartService.createCart();
            user.cart = newCart._id;
            await UserService.updateUserDetails(user._id, { cart: newCart._id });
            userCartId = newCart._id;
            console.log(`Carrito creado y asignado al usuario ${user.email}: ${userCartId}`);
        } else {
            console.log(`Usuario ${user.email} ya tiene carrito: ${userCartId}`);
        }

        const userForToken = { ...user._doc };
        delete userForToken.password;
        userForToken.cart = userCartId;

        const token = jwt.sign({ user: userForToken }, JWT_SECRET, { expiresIn: JWT_EXPIRATION_TIME });
        res.cookie('jwtCookie', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: JWT_COOKIE_MAX_AGE_MS
        });

        res.redirect("/profile");
    } catch (error) {
        console.error("Error en la ruta de login después de autenticación:", error);
        res.redirect("/failed");
    }
});

// Ruta de logout
router.post("/logout", (req, res) => {
    res.clearCookie('jwtCookie');
    res.redirect("/login");
});

// Ruta /current (Modificada para enviar DTO)
router.get("/current", passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const userDTO = new UserDTO(req.user);
        res.json({ status: "success", user: userDTO });
    } catch (error) {
        console.error("Error en /current:", error);
        res.status(500).json({ status: "error", message: "Error al obtener usuario actual." });
    }
});

// Ruta para solicitar restablecimiento de contraseña
router.post('/requestPasswordReset', async (req, res) => {
    try {
        const { email } = req.body;
        console.log(`DEBUG (session.router): Recibida solicitud de restablecimiento para email: ${email}`);
        await UserService.requestPasswordReset(email);
        res.json({ status: "success", message: "Si el email está registrado, se ha enviado un enlace para restablecer la contraseña." });
    } catch (error) {
        console.error("Error al solicitar restablecimiento de contraseña:", error);
        res.status(500).json({ status: "error", message: error.message || "Error al procesar la solicitud de restablecimiento." });
    }
});

// Ruta para restablecer contraseña
router.post('/resetPassword', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        console.log(`DEBUG (session.router): Recibida solicitud de restablecer contraseña con token: ${token} y nueva contraseña.`);
        await UserService.resetPassword(token, newPassword);
        res.json({ status: "success", message: "Contraseña restablecida exitosamente." });
    } catch (error) {
        console.error("Error al restablecer contraseña:", error);
        res.status(400).json({ status: "error", message: error.message || "Error al restablecer la contraseña." });
    }
});

export default router;
