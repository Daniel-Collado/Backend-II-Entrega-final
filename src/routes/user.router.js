import { Router } from 'express';
import UserController from '../controllers/UserController.js';
import { isAuthenticated, authorizeRoles, isUserOwnerOrAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// GET /api/users - Obtener todos los usuarios (solo admin)
router.get('/', isAuthenticated, authorizeRoles('admin'), UserController.getAllUsers.bind(UserController));

// GET /api/users/:pid - Obtener un usuario por ID (dueño o admin)
router.get('/:pid', isAuthenticated, isUserOwnerOrAdmin(UserController), UserController.getUserById.bind(UserController));

// POST /api/users - Crear un nuevo usuario (solo admin)
router.post('/', isAuthenticated, authorizeRoles('admin'), UserController.createUser.bind(UserController));

// PUT /api/users/:pid - Actualizar un usuario (dueño o admin)
router.put('/:pid', isAuthenticated, isUserOwnerOrAdmin(UserController), UserController.updateUser.bind(UserController));

// DELETE /api/users/:pid - Eliminar un usuario (solo admin)
router.delete('/:pid', isAuthenticated, authorizeRoles('admin'), UserController.deleteUser.bind(UserController));


export default router;