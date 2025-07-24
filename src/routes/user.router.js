import { Router } from 'express';
import UserService from '../services/UserService.js';
import { isAuthenticated, authorizeRoles, isUserOwnerOrAdmin } from '../middlewares/auth.middleware.js';
import { createHash } from '../../utils.js';

const router = Router();

// GET /api/users - Obtener todos los usuarios (sólo admin)
router.get('/', isAuthenticated, authorizeRoles('admin'), async (req, res) => {
    try {
        const users = await UserService.getAllUsers(); 
        res.json({ status: "success", payload: users });
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        res.status(500).send("Error en el servidor");
    }
});

// GET /api/users/:pid - Obtener un usuario por ID (dueño o admin)
router.get('/:pid', isAuthenticated, isUserOwnerOrAdmin(UserService), async (req, res) => {
    const id = req.params.pid;
    try {
        const user = await UserService.getUserDetails(id);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Usuario no encontrado.' });
        }
        res.json({ status: 'success', payload: user });
    } catch (error) {
        console.error("Error al obtener usuario por ID:", error);
        res.status(500).send("Error en el servidor");
    }
});

// POST /api/users - Crear un nuevo usuario (solo admin)
router.post('/', isAuthenticated, authorizeRoles('admin'), async (req, res) => {
    try {
        const { first_name, last_name, email, age, password, role } = req.body;
        if (!first_name || !last_name || !email || !age || !password) {
            return res.status(400).json({ status: 'error', message: 'Faltan campos requeridos: first_name, last_name, email, age, password.' });
        }

        const newUser = await UserService.registerUser({ first_name, last_name, email, age, password, role });
        res.status(201).json({ status: 'success', payload: newUser.id, user: newUser }); // newUser ya es un DTO
    } catch (error) {
        console.error("Error al crear usuario:", error);
        res.status(500).json({ status: "error", message: error.message || "Error en el servidor" });
    }
});

// PUT /api/users/:pid - Actualizar un usuario (dueño o admin)
router.put('/:pid', isAuthenticated, isUserOwnerOrAdmin(UserService), async (req, res) => {
    const id = req.params.pid;
    try {
        const { password, ...updateData } = req.body;

        if (password) {
            updateData.password = password;
        }

        const updatedUser = await UserService.updateUserDetails(id, updateData);
        res.json({ status: 'success', payload: updatedUser });
    } catch (error) {
        console.error("Error al actualizar usuario:", error);
        res.status(500).json({ status: 'error', message: error.message || "Error en el servidor" });
    }
});

// DELETE /api/users/:pid - Eliminar un usuario (solo admin)
router.delete('/:pid', isAuthenticated, authorizeRoles('admin'), async (req, res) => {
    const id = req.params.pid;
    try {
        await UserService.deleteUser(id);
        res.json({ status: 'success', message: 'Usuario eliminado exitosamente.' });
    } catch (error) {
        console.error("Error al eliminar usuario:", error);
        res.status(500).json({ status: 'error', message: error.message || "Error en el servidor" });
    }
});

export default router;