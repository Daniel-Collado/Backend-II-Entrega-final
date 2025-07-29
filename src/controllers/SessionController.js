import UserService from '../services/UserService.js';
import CartService from '../services/CartService.js';
import UserDTO from '../dtos/UserDTO.js'; 
import { generateToken } from '../../utils.js'; 
import config from '../config/index.js'; 

const { JWT_SECRET, JWT_COOKIE_MAX_AGE_MS } = config; 

class SessionController {
    constructor() {
        this.userService = UserService; 
        this.cartService = CartService; 
    }

    async register(req, res) {
        try {
            const user = req.user; // El usuario viene de la estrategia 'register' de Passport

            let userCartId = user.cart;
            if (!userCartId) {
                console.log(`Usuario ${user.email} (registro) no tiene carrito. Creando uno nuevo...`);
                const newCart = await this.cartService.createCart(); //
                user.cart = newCart._id;
                await this.userService.updateUserDetails(user._id, { cart: newCart._id }); //
                userCartId = newCart._id;
                console.log(`Carrito creado y asignado al usuario ${user.email}: ${userCartId}`);
            }

            
                res.status(201).json({ status: "success", message: "Usuario registrado exitosamente." });
            } catch (error) {
                console.error("Error en el registro (SessionController):", error);
                res.status(500).json({ status: "error", message: error.message || "Error al registrar el usuario." });
            }
    }

    async login(req, res) {
        try {
            const user = req.user; // El usuario viene de la estrategia 'login' de Passport

            let userCartId = user.cart;
            if (!userCartId) {
                console.log(`Usuario ${user.email} (login) no tiene carrito. Creando uno nuevo...`);
                const newCart = await this.cartService.createCart(); 
                user.cart = newCart._id;
                await this.userService.updateUserDetails(user._id, { cart: newCart._id }); 
                userCartId = newCart._id;
                console.log(`Carrito creado y asignado al usuario ${user.email}: ${userCartId}`);
            }

            const userForToken = { ...user._doc };
            delete userForToken.password;
            userForToken.cart = userCartId;

            const token = generateToken(userForToken); 

            res.cookie('jwtCookie', token, {
                maxAge: JWT_COOKIE_MAX_AGE_MS, 
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Lax'
            })
            .json({
                status: "success",
                message: "Login exitoso",
                redirect: "/products"
            });
        } catch (error) {
            console.error("Error en el login:", error);
            res.status(500).json({ status: "error", message: error.message || "Error interno del servidor al iniciar sesión." });
        }
    }

    async logout(req, res) {
        try {
            res.clearCookie('jwtCookie');
            res.redirect('/login');
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
            res.status(500).json({ status: "error", message: error.message || "Error al cerrar sesión." });
        }
    }

    async getCurrentUser(req, res) {
        try {
            if (req.user) {
                // console.log("SESSION_CONTROLLER: Usuario actual (desde req.user):", req.user);
                res.json({ status: "success", payload: req.user });
            } else {
                res.status(401).json({ status: "error", message: "No hay usuario autenticado." });
            }
        } catch (error) {
            console.error("Error al obtener usuario actual:", error);
            res.status(500).json({ status: "error", message: "Error al obtener usuario actual." });
        }
    }

    async requestPasswordReset(req, res) {
        try {
            const { email } = req.body;
            console.log(`DEBUG (SessionController): Recibida solicitud de restablecimiento para email: ${email}`);
            await this.userService.requestPasswordReset(email); //
            res.json({ status: "success", message: "Si el email está registrado, se ha enviado un enlace para restablecer la contraseña." });
        } catch (error) {
            console.error("Error al solicitar restablecimiento de contraseña:", error);
            res.status(500).json({ status: "error", message: error.message || "Error al procesar la solicitud de restablecimiento." });
        }
    }

    async resetPassword(req, res) {
        try {
            const { token, newPassword } = req.body;
            console.log(`DEBUG (SessionController): Recibida solicitud de restablecer contraseña con token: ${token} y nueva contraseña.`);
            await this.userService.resetPassword(token, newPassword); //
            res.json({ status: "success", message: "Contraseña restablecida exitosamente." });
        } catch (error) {
            console.error("Error al restablecer contraseña:", error);
            res.status(400).json({ status: "error", message: error.message || "Error al restablecer la contraseña. Token inválido o expirado." });
        }
    }
}

export default new SessionController();