import UserService from '../services/UserService.js';
import { generateToken } from '../../utils.js';
import config from '../config/index.js';

class UserController {
    async getAllUsers(req, res) {
        try {
        const users = await UserService.getAllUsers();
        res.json({ status: 'success', payload: users });
        } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ status: 'error', message: 'Error en el servidor' });
        }
    }

    async getUserById(req, res) {
        try {
        const user = await UserService.getUserDetails(req.params.pid);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Usuario no encontrado.' });
        }
        res.json({ status: 'success', payload: user });
        } catch (error) {
        console.error('Error al obtener usuario por ID:', error);
        res.status(500).json({ status: 'error', message: 'Error en el servidor' });
        }
    }

    async createUser(req, res) {
        try {
        const { first_name, last_name, email, age, password, role } = req.body;
        if (!first_name || !last_name || !email || !age || !password) {
            return res.status(400).json({
            status: 'error',
            message: 'Faltan campos requeridos: first_name, last_name, email, age, password.',
            });
        }
        const newUser = await UserService.registerUser({ first_name, last_name, email, age, password, role });
        res.status(201).json({ status: 'success', payload: newUser.id, user: newUser });
        } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Error en el servidor' });
        }
    }

    async updateUser(req, res) {
        try {
        const { password, ...updateData } = req.body;
        if (password) {
            updateData.password = password;
        }
        const updatedUser = await UserService.updateUserDetails(req.params.pid, updateData);
        res.json({ status: 'success', payload: updatedUser });
        } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Error en el servidor' });
        }
    }

    async deleteUser(req, res) {
        try {
        await UserService.deleteUser(req.params.pid);
        res.json({ status: 'success', message: 'Usuario eliminado exitosamente.' });
        } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Error en el servidor' });
        }
    }

    async registerUser(req, res) {
        try {
        const { first_name, last_name, email, age, password } = req.body;
        if (!first_name || !last_name || !email || !age || !password) {
            return res.status(400).json({
            status: 'error',
            message: 'Faltan campos requeridos: first_name, last_name, email, age, password.',
            });
        }
        const newUser = await UserService.registerUser({ first_name, last_name, email, age, password });
        res.status(201).json({ status: 'success', payload: newUser.id, user: newUser });
        } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(400).json({ status: 'error', message: error.message || 'Error al registrar usuario' });
        }
    }

    async loginUser(req, res) {
        try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
            status: 'error',
            message: 'Faltan campos requeridos: email, password.',
            });
        }
        const user = await UserService.loginUser(email, password);
        const token = generateToken(user);

        // Establecer cookie 'jwtCookie' para Passport
        res.cookie('jwtCookie', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: parseInt(config.JWT_COOKIE_MAX_AGE_MS, 10), // Usar config
        });

        res.json({ status: 'success', payload: { user, token } });
        } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(401).json({ status: 'error', message: error.message || 'Credenciales inválidas' });
        }
    }

    async requestPasswordReset(req, res) {
        try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ status: 'error', message: 'El campo email es requerido.' });
        }
        await UserService.requestPasswordReset(email);
        res.json({ status: 'success', message: 'Correo de restablecimiento enviado.' });
        } catch (error) {
        console.error('Error al solicitar restablecimiento de contraseña:', error);
        res.status(400).json({ status: 'error', message: error.message || 'Error al procesar la solicitud' });
        }
    }

    async resetPassword(req, res) {
        try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({
            status: 'error',
            message: 'Faltan campos requeridos: token, newPassword.',
            });
        }
        await UserService.resetPassword(token, newPassword);
        res.json({ status: 'success', message: 'Contraseña restablecida exitosamente.' });
        } catch (error) {
        console.error('Error al restablecer contraseña:', error);
        res.status(400).json({ status: 'error', message: error.message || 'Error al restablecer contraseña' });
        }
    }
}

export default new UserController();