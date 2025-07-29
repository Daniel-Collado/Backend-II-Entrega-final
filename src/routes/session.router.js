import { Router } from 'express';
import passport from 'passport';
import SessionController from '../controllers/SessionController.js';

const router = Router();

// Ruta de registro
router.post('/register', passport.authenticate('register', {
    session: false,
    failureRedirect: '/failed'
}), SessionController.register.bind(SessionController)); 

// Ruta de login
router.post('/login', passport.authenticate('login', {
    session: false,
    failureRedirect: '/failed'
}), SessionController.login.bind(SessionController));

// Ruta para cerrar sesión
router.post('/logout', SessionController.logout.bind(SessionController));

// Ruta para obtener usuario actual
router.get('/current', passport.authenticate('jwt', { session: false }), SessionController.getCurrentUser.bind(SessionController));

// Ruta para pedir restablecimiento de contraseña
router.post('/requestPasswordReset', SessionController.requestPasswordReset.bind(SessionController));

// Ruta para restablecer contraseña
router.post('/resetPassword', SessionController.resetPassword.bind(SessionController));

export default router;