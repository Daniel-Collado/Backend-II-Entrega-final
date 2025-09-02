import { Router } from 'express';
import passport from 'passport';
import ViewsController from '../controllers/ViewsController.js';

const router = Router();

// Página principal
router.get('/', ViewsController.renderHome.bind(ViewsController));

// Vista de login
router.get('/login', ViewsController.renderLogin.bind(ViewsController));

// Vista de registro
router.get('/register', ViewsController.renderRegister.bind(ViewsController));

// Vista de solicitud de restablecimiento de contraseña
router.get('/request-password-reset', ViewsController.renderRequestPasswordReset.bind(ViewsController));

// Vista de restablecimiento de contraseña
router.get('/reset-password', ViewsController.renderResetPassword.bind(ViewsController));

// Vista de productos (protegida)
router.get('/products', passport.authenticate('jwt', { session: false, failureRedirect: '/login' }), ViewsController.renderProducts.bind(ViewsController));

// Vista de perfil (protegida)
router.get('/profile', passport.authenticate('jwt', { session: false, failureRedirect: '/login' }), ViewsController.renderProfile.bind(ViewsController));

// Vista de creación de producto (solo admin)
router.get('/admin/create-product', passport.authenticate('jwt', { session: false, failureRedirect: '/login' }), ViewsController.renderCreateProduct.bind(ViewsController));

// Vista de carrito (protegida)
router.get('/cart', passport.authenticate('jwt', { session: false, failureRedirect: '/login' }), ViewsController.renderCart.bind(ViewsController));

// Vista de detalles de ticket (protegida)
router.get('/ticket/:code', passport.authenticate('jwt', { session: false, failureRedirect: '/login' }), ViewsController.renderTicket.bind(ViewsController));

//Vista de obtención de todos los tickets (protegida)
router.get('/tickets', passport.authenticate('jwt', { session: false, failureRedirect: '/login' }), ViewsController.renderTickets.bind(ViewsController));

// NUEVA RUTA: Vista de detalles de un ticket individual para administradores
router.get('/tickets/:code', passport.authenticate('jwt', { session: false, failureRedirect: '/login' }), ViewsController.renderTicket.bind(ViewsController));

export default router;