
import { Router } from 'express';
import passport from 'passport'; 

const router = Router();

router.get("/login", (req, res) => {
    res.render("login", { title: "Iniciar Sesión" });
});

router.get("/register", (req, res) => {
    res.render("register", { title: "Registrarse" });
});

router.get("/restore", (req, res) => { 
    res.render("restore", { title: "Restaurar Contraseña" });
});

router.get("/products", passport.authenticate('jwt', {
    session: false,           
    failureRedirect: '/login' 
}), (req, res) => {
    
    console.log("VIEWS_ROUTER: Acceso exitoso a /products. Contenido de req.user:", req.user);
    const userCartId = req.user.cart || null; // Obtiene el cartId del usuario logueado
    res.render("products", {
        title: "Productos", 
        user: { // Pasa solo los datos relevantes del usuario a la vista
            first_name: req.user.first_name,
            last_name: req.user.last_name,
            email: req.user.email,
            role: req.user.role,
            cartId: userCartId // <-- AÑADIR: Pasa el ID del carrito a la vista
        },
    });
});


router.get("/profile", passport.authenticate('jwt', {
    session: false,
    failureRedirect: '/login'
}), (req, res) => {
    console.log("VIEWS_ROUTER: Accediendo a /profile. Contenido de req.user:", req.user);
    if (!req.user) {
        console.error("VIEWS_ROUTER: req.user es null/undefined a pesar de autenticación exitosa. Redirigiendo a login.");
        return res.redirect('/login');
    }
    res.render("profile", { title: "Perfil de Usuario", user: req.user });
});


router.get("/admin/create-product", passport.authenticate('jwt', {
    session: false,
    failureRedirect: '/login'
}), (req, res, next) => {
    // Verificar si el usuario tiene rol 'admin'
    if (req.user && req.user.role === 'admin') {
        res.render("createProduct", { title: "Crear Nuevo Producto", user: req.user });
    } else {
        res.status(403).render("failed", { title: "Acceso Denegado", message: "No tenés permisos para acceder a esta página." });
    }
});

router.get("/failed", (req, res) => {
    res.render("failed", { title: "Autenticación Fallida" });
});

router.get("/", (req, res) => {
    res.render("index", { title: "Bienvenido" }); 
});

export default router;