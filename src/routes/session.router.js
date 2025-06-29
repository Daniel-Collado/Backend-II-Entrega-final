import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import userModel from '../models/user.model.js'; 
import cartModel from '../models/cart.model.js';   

const { JWT_SECRET, JWT_EXPIRATION_TIME, JWT_COOKIE_MAX_AGE_MS } = config;

const router = Router();

// Ruta de registro
router.post('/register', passport.authenticate('register', {
    session: false,
    failureRedirect: '/failed'
}), async (req, res) => {
    try {
        const userForToken = req.user; // De acá obtiene el usuario recién creado de Passport

        // Lógica para crear/asociar carrito en el registro
        let userCartId = userForToken.cart;
        if (!userCartId) {
            console.log(`Usuario ${userForToken.email} (registro) no tiene carrito. Creando uno nuevo...`);
            const newCart = await cartModel.create({});
            userForToken.cart = newCart._id; 
            await userModel.findByIdAndUpdate(userForToken._id, { cart: newCart._id }); // Guardar
            userCartId = newCart._id;
            console.log(`Carrito creado y asignado al usuario ${userForToken.email}: ${userCartId}`);
        }

        const token = jwt.sign({
            id: userForToken._id,
            first_name: userForToken.first_name,
            last_name: userForToken.last_name,
            email: userForToken.email,
            role: userForToken.role,
            cart: userCartId 
        },  JWT_SECRET, { expiresIn: JWT_EXPIRATION_TIME });

        res.cookie('jwtCookie', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: JWT_COOKIE_MAX_AGE_MS
        });

        res.status(201).json({
            status: "success",
            message: "Registro exitoso",
            user: {
                first_name: userForToken.first_name,
                last_name: userForToken.last_name,
                email: userForToken.email,
                role: userForToken.role,
                cartId: userCartId 
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
        let userCartId = user.cart;

        if (!userCartId) {
            console.log(`Usuario ${user.email} (login) no tiene carrito. Creando uno nuevo...`);
            const newCart = await cartModel.create({}); 
            user.cart = newCart._id; 
            await user.save();      
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

        res.redirect("/profile"); // Redirige
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

// Ruta /current 
router.get("/current", passport.authenticate('jwt', { session: false }), (req, res) => {
    res.json({ status: "success", user: req.user });
});

// Ruta /restore 
router.post('/restore', async (req, res) => {
    
});

export default router;