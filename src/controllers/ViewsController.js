// src/controllers/ViewsController.js
import ProductService from '../services/ProductService.js';
import CartService from '../services/CartService.js';
import UserService from '../services/UserService.js';
import TicketService from '../services/TicketService.js';

class ViewsController {
  // Renderizar página principal
    async renderHome(req, res) {
        try {
        res.render('index', {
            title: 'Bienvenido',
            user: req.user || null,
        });
        } catch (error) {
        console.error('Error al renderizar página principal:', error);
        res.status(500).render('failed', { title: 'Error', message: 'Error en el servidor' });
        }
    }

    // Renderizar vista de login
    async renderLogin(req, res) {
        try {
        if (req.user) {
            return res.redirect('/products');
        }
        res.render('login', {
            title: 'Iniciar Sesión',
        });
        } catch (error) {
        console.error('Error al renderizar vista de login:', error);
        res.status(500).render('failed', { title: 'Error', message: 'Error en el servidor' });
        }
    }

    // Renderizar vista de registro
    async renderRegister(req, res) {
        try {
        if (req.user) {
            return res.redirect('/products');
        }
        res.render('register', {
            title: 'Registrarse',
        });
        } catch (error) {
        console.error('Error al renderizar vista de registro:', error);
        res.status(500).render('failed', { title: 'Error', message: 'Error en el servidor' });
        }
    }

    // Renderizar vista de solicitud de restablecimiento de contraseña
    async renderRequestPasswordReset(req, res) {
        try {
        if (req.user) {
            return res.redirect('/products');
        }
        res.render('requestPasswordReset', {
            title: 'Solicitar Restablecimiento de Contraseña',
        });
        } catch (error) {
        console.error('Error al renderizar vista de solicitud de restablecimiento:', error);
        res.status(500).render('failed', { title: 'Error', message: 'Error en el servidor' });
        }
    }

    // Renderizar vista de restablecimiento de contraseña
    async renderResetPassword(req, res) {
        try {
        const { token } = req.query;
        if (!token) {
            return res.status(400).render('failed', {
            title: 'Error',
            message: 'Token de restablecimiento no proporcionado.',
            });
        }
        res.render('resetPassword', {
            title: 'Restablecer Contraseña',
            token,
        });
        } catch (error) {
        console.error('Error al renderizar vista de restablecimiento de contraseña:', error);
        res.status(500).render('failed', { title: 'Error', message: 'Error en el servidor' });
        }
    }

    // Renderizar lista de productos
    async renderProducts(req, res) {
        try {
        const products = await ProductService.getAllProducts(); 
        res.render('products', {
            title: 'Productos',
            user: req.user ? {
            first_name: req.user.first_name,
            last_name: req.user.last_name,
            email: req.user.email,
            role: req.user.role,
            cartId: req.user.cart || null,
            } : null,
            products,
        });
        } catch (error) {
        console.error('Error al renderizar vista de productos:', error);
        res.status(500).render('failed', { title: 'Error', message: 'Error en el servidor' });
        }
    }

    // Renderizar perfil de usuario
    async renderProfile(req, res) {
        try {
        if (!req.user) {
            return res.redirect('/login');
        }
        const userDTO = await UserService.getCurrentUser(req.user._id);
        res.render('profile', {
            title: 'Perfil de Usuario',
            user: userDTO,
        });
        } catch (error) {
        console.error('Error al renderizar vista de perfil:', error);
        res.status(500).render('failed', { title: 'Error', message: 'Error en el servidor' });
        }
    }

    // Renderizar formulario de creación de producto (solo admin)
    async renderCreateProduct(req, res) {
        try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).render('failed', {
            title: 'Acceso Denegado',
            message: 'No tenés permisos para acceder a esta página.',
            });
        }
        res.render('createProduct', {
            title: 'Crear Nuevo Producto',
            user: req.user,
        });
        } catch (error) {
        console.error('Error al renderizar vista de creación de producto:', error);
        res.status(500).render('failed', { title: 'Error', message: 'Error en el servidor' });
        }
    }

    // Renderizar detalles del carrito
    async renderCart(req, res) {
        try {
        if (!req.user) {
            return res.redirect('/login');
        }
        if (!req.user.cart) {
            return res.render('cartDetail', {
            title: 'Tu Carrito',
            cart: null,
            message: 'No tienes un carrito asociado.',
            user: req.user,
            });
        }
        const cart = await CartService.getCartById(req.user.cart);
        if (!cart) {
            return res.render('cartDetail', {
            title: 'Tu Carrito',
            cart: null,
            message: 'No se encontró tu carrito.',
            user: req.user,
            });
        }
        res.render('cartDetail', {
            title: 'Tu Carrito',
            cart,
            user: req.user,
        });
        } catch (error) {
        console.error('Error al renderizar vista de carrito:', error);
        res.status(500).render('failed', { title: 'Error', message: 'Error al cargar el carrito.' });
        }
    }

    // Renderizar detalles de un ticket
    async renderTicket(req, res) {
        try {
        if (!req.user) {
            return res.redirect('/login');
        }
        const ticketCode = req.params.code;
        const ticket = await TicketService.getTicketByCode(ticketCode);
        if (!ticket) {
            return res.status(404).render('failed', {
            title: 'Ticket No Encontrado',
            message: 'El ticket solicitado no existe.',
            });
        }
        if (req.user.role !== 'admin' && req.user.email !== ticket.purchaser) {
            return res.status(403).render('failed', {
            title: 'Acceso Denegado',
            message: 'No tenés permisos para ver este ticket.',
            });
        }
        res.render('ticketDetail', {
            title: `Ticket ${ticket.code}`,
            ticket,
            user: req.user,
        });
        } catch (error) {
        console.error('Error al renderizar vista de ticket:', error);
        res.status(500).render('failed', { title: 'Error', message: 'Error al cargar el detalle del ticket.' });
        }
    }
}

export default new ViewsController();