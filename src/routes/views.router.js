import { Router } from 'express';
import passport from 'passport';
import UserService from '../services/UserService.js';
import CartService from '../services/CartService.js'; 
import TicketService from '../services/TicketService.js'; 

const router = Router();

router.get("/login", (req, res) => {
    res.render("login", { title: "Iniciar Sesión" });
});

router.get("/register", (req, res) => {
    res.render("register", { title: "Registrarse" });
});

router.get("/request-password-reset", (req, res) => {
    res.render("requestPasswordReset", { title: "Solicitar Restablecimiento de Contraseña" });
});

router.get("/reset-password", async (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.status(400).render("failed", { title: "Error", message: "Token de restablecimiento no proporcionado." });
    }
    res.render("resetPassword", { title: "Restablecer Contraseña", token: token });
});


router.get("/products", passport.authenticate('jwt', {
    session: false,
    failureRedirect: '/login'
}), (req, res) => {

    console.log("VIEWS_ROUTER: Acceso exitoso a /products. Contenido de req.user:", req.user);
    const userCartId = req.user.cart || null;
    res.render("products", {
        title: "Productos",
        user: {
            first_name: req.user.first_name,
            last_name: req.user.last_name,
            email: req.user.email,
            role: req.user.role,
            cartId: userCartId
        },
    });
});


router.get("/profile", passport.authenticate('jwt', {
    session: false,
    failureRedirect: '/login'
}), async (req, res) => {
    console.log("VIEWS_ROUTER: Accediendo a /profile. Contenido de req.user:", req.user);
    if (!req.user) {
        console.error("VIEWS_ROUTER: req.user es null/undefined a pesar de autenticación exitosa. Redirigiendo a login.");
        return res.redirect('/login');
    }
    const userDTO = await UserService.getCurrentUser(req.user._id);
    res.render("profile", { title: "Perfil de Usuario", user: userDTO });
});


router.get("/admin/create-product", passport.authenticate('jwt', {
    session: false,
    failureRedirect: '/login'
}), (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        res.render("createProduct", { title: "Crear Nuevo Producto", user: req.user });
    } else {
        res.status(403).render("failed", { title: "Acceso Denegado", message: "No tenés permisos para acceder a esta página." });
    }
});

// NUEVA RUTA PARA EL DETALLE DEL CARRITO
router.get("/cart", passport.authenticate('jwt', {
    session: false,
    failureRedirect: '/login'
}), async (req, res) => {
    try {
        if (!req.user || !req.user.cart) {
            return res.render("cartDetail", { title: "Tu Carrito", cart: null, message: "No tienes un carrito asociado." });
        }
        const cart = await CartService.getCartById(req.user.cart);
        if (!cart) {
            return res.render("cartDetail", { title: "Tu Carrito", cart: null, message: "No se encontró tu carrito." });
        }
        res.render("cartDetail", { title: "Tu Carrito", cart: cart });
    } catch (error) {
        console.error("Error al cargar el detalle del carrito:", error);
        res.status(500).render("failed", { title: "Error", message: "Error al cargar el carrito." });
    }
});

// DETALLE DEL TICKET
router.get("/ticket/:code", passport.authenticate('jwt', {
    session: false,
    failureRedirect: '/login'
}), async (req, res) => {
    try {
        const ticketCode = req.params.code;
        const ticket = await TicketService.getTicketByCode(ticketCode); 
        if (!ticket) {
            return res.status(404).render("failed", { title: "Ticket No Encontrado", message: "El ticket solicitado no existe." });
        }
        if (req.user.role !== 'admin' && req.user.email !== ticket.purchaser) {
            return res.status(403).render("failed", { title: "Acceso Denegado", message: "No tenés permisos para ver este ticket." });
        }

        res.render("ticketDetail", { title: `Ticket ${ticket.code}`, ticket: ticket });
    } catch (error) {
        console.error("Error al cargar el detalle del ticket:", error);
        res.status(500).render("failed", { title: "Error", message: "Error al cargar el detalle del ticket." });
    }
});


router.get("/failed", (req, res) => {
    res.render("failed", { title: "Autenticación Fallida" });
});

router.get("/", (req, res) => {
    res.render("index", { title: "Bienvenido" });
});

export default router;
