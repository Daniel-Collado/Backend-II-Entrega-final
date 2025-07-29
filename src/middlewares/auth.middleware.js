// src/middlewares/auth.middleware.js
import passport from 'passport';
// IMPORTANTE: NO IMPORTAR SERVICIOS DIRECTAMENTE AQUÍ.
// Los servicios (UserService, CartService) deben ser pasados como argumentos
// a las funciones de orden superior (isCartOwnerOrAdmin, isUserOwnerOrAdmin)
// desde los routers donde se instancian.

// Middleware para verificar si el usuario está autenticado
export const isAuthenticated = (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err) {
            console.error("Error de autenticación JWT:", err);
            return next(err);
        }
        if (!user) {
            if (req.accepts('html')) {
                return res.redirect('/login');
            }
            return res.status(401).json({ status: 'error', message: 'No autenticado. Token inválido o no proporcionado.' });
        }
        req.user = user;
        next();
    })(req, res, next);
};

// Middleware para verificar roles
export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            if (req.accepts('html')) {
                return res.redirect('/login');
            }
            return res.status(401).json({ status: 'error', message: 'No autenticado. Usuario no disponible.' });
        }

        if (!roles.includes(req.user.role)) {
            if (req.accepts('html')) {
                return res.status(403).render("failed", { title: "Acceso Denegado", message: "No tenés permisos para acceder a esta página." });
            }
            return res.status(403).json({ status: 'error', message: 'Acceso denegado. Rol no autorizado.' });
        }
        next();
    };
};

// Middleware para verificar propiedad de carrito o rol de admin
// Recibe los servicios necesarios como parámetros.
export const isCartOwnerOrAdmin = (cartService, userService) => {
    // Los logs de depuración se pueden dejar para futuras depuraciones si es necesario.
    // console.log('DEBUG: isCartOwnerOrAdmin - Instanciando middleware.');
    // console.log('DEBUG: isCartOwnerOrAdmin - cartService recibido:', cartService);
    // console.log('DEBUG: isCartOwnerOrAdmin - userService recibido:', userService);
    // console.log('DEBUG: isCartOwnerOrAdmin - Tipo de userService:', typeof userService);
    // console.log('DEBUG: isCartOwnerOrAdmin - ¿userService tiene getUserById?', typeof userService.getUserById);

    return async (req, res, next) => {
        const cartId = req.params.cid || req.body.cartId;
        const userId = req.user._id;

        // console.log('DEBUG: Dentro de isCartOwnerOrAdmin middleware - req.user:', req.user);
        // console.log('DEBUG: Dentro de isCartOwnerOrAdmin middleware - userService (capturado):', userService);

        if (req.user.role === 'admin') {
            return next();
        }

        try {
            // CAMBIO CLAVE AQUÍ: Acceder a los métodos directamente desde la instancia de servicio
            const user = await userService.getCurrentUser(userId); // Usar getCurrentUser que devuelve un DTO

            if (!user || user.cart.toString() !== cartId) {
                return res.status(403).json({ status: 'error', message: 'Acceso denegado. No eres el propietario de este carrito.' });
            }
            next();
        } catch (error) {
            console.error("Error al verificar propietario del carrito:", error);
            res.status(500).json({ status: 'error', message: 'Error interno del servidor al verificar acceso al carrito.' });
        }
    };
};


// Middleware para verificar que el usuario logueado es el mismo que el del ID en la URL o es admin
// Recibe el servicio de usuario como parámetro.
export const isUserOwnerOrAdmin = (userService) => {
    // Los logs de depuración se pueden dejar para futuras depuraciones si es necesario.
    // console.log('DEBUG: isUserOwnerOrAdmin - Instanciando middleware.');
    // console.log('DEBUG: isUserOwnerOrAdmin - userService recibido:', userService);
    // console.log('DEBUG: isUserOwnerOrAdmin - Tipo de userService:', typeof userService);
    // console.log('DEBUG: isUserOwnerOrAdmin - ¿userService tiene getUserById?', typeof userService.getUserById);

    return async (req, res, next) => {
        const userIdParam = req.params.pid;
        const loggedInUserId = req.user._id.toString();

        if (req.user.role === 'admin') {
            return next();
        }

        if (loggedInUserId === userIdParam) {
            return next();
        }

        return res.status(403).json({ status: 'error', message: 'Acceso denegado. No tienes permiso para acceder a este recurso de usuario.' });
    };
};
