import UserRepository from '../repositories/UserRepository.js';
import { createHash, isValidPassword, generateToken } from '../../utils.js';
import nodemailer from 'nodemailer';
import config from '../config/index.js';
import jwt from 'jsonwebtoken';

const { JWT_SECRET, MAILING_SERVICE, MAILING_USER, MAILING_PASSWORD, RESET_PASSWORD_TOKEN_EXPIRATION } = config;

class UserService {
    constructor(userRepository) {
        this.userRepository = userRepository;
        this.transporter = nodemailer.createTransport({
            service: MAILING_SERVICE,
            port: 587,
            auth: {
                user: MAILING_USER,
                pass: MAILING_PASSWORD
            }
        });
    }

    async registerUser(userData) {
        const { email, password } = userData;
        const userFound = await this.userRepository.findUserRaw({ email }); // Obtener el objeto completo
        if (userFound) {
            throw new Error("El email ya está registrado.");
        }
        userData.password = createHash(password);
        userData.role = email === 'adminCoder@coder.com' ? 'admin' : 'user';
        const newUser = await this.userRepository.createUser(userData);
        return newUser; // DTO
    }

    async loginUser(email, password) {
        const user = await this.userRepository.findUserRaw({ email }); // Obtener el objeto completo
        if (!user || !isValidPassword(password, user.password)) {
            throw new Error("Credenciales inválidas.");
        }
        return user; 
    }

    async getCurrentUser(userId) {
        const user = await this.userRepository.getUserById(userId);
        if (!user) {
            throw new Error("Usuario no encontrado.");
        }
        return user;
    }

    async requestPasswordReset(email) {
        const user = await this.userRepository.findUserRaw({ email });
        if (!user) {
            throw new Error("Usuario no encontrado.");
        }

        const resetToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: RESET_PASSWORD_TOKEN_EXPIRATION });
        await this.userRepository.updateUserRaw(user._id, {
            resetPasswordToken: resetToken,
            resetPasswordExpires: Date.now() + (RESET_PASSWORD_TOKEN_EXPIRATION * 1000) 
        });

        const resetLink = `http://localhost:${config.PORT}/reset-password?token=${resetToken}`;

        const mailOptions = {
            from: MAILING_USER,
            to: user.email,
            subject: 'Restablecimiento de Contraseña',
            html: `
                <p>Solicitaste restablecer tu contraseña.</p>
                <p>Hacé clic en el siguiente enlace para restablecerla:</p>
                <a href="${resetLink}">Restablecer Contraseña</a>
                <p>Este enlace se autodestruirá en ${RESET_PASSWORD_TOKEN_EXPIRATION / 60} minutos.</p>
                <p>Si no solicitaste esto, ignorá este correo.</p>
            `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            console.error("Error al enviar correo de restablecimiento:", error);
            throw new Error("Error al enviar el correo de restablecimiento.");
        }
    }

    async resetPassword(token, newPassword) {
        const user = await this.userRepository.findUserRaw({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            throw new Error("Token inválido o expirado.");
        }

        // Evitar que el usuario pueda restablecer la contraseña a la que ya tenía anteriormente.
        if (isValidPassword(newPassword, user.password)) {
            throw new Error("La nueva contraseña no puede ser igual a la anterior.");
        }

        user.password = createHash(newPassword);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await this.userRepository.updateUserRaw(user._id, user); // Usuario actualizado

        return true;
    }

    async getAllUsers() {
        const users = await this.userRepository.dao.find();
        return users.map(user => new UserDTO(user));
    }

    async getUserDetails(id) {
        const user = await this.userRepository.getUserById(id);
        if (!user) {
            throw new Error("Usuario no encontrado.");
        }
        return user;
    }

    async updateUserDetails(id, data) {
        if (data.password) {
            data.password = createHash(data.password);
        }
        const updatedUser = await this.userRepository.updateUser(id, data);
        if (!updatedUser) {
            throw new Error("Usuario no encontrado para actualizar.");
        }
        return updatedUser;
    }

    async deleteUser(id) {
        const result = await this.userRepository.deleteUser(id);
        if (result.deletedCount === 0) {
            throw new Error("Usuario no encontrado para eliminar.");
        }
        return true;
    }
}

export default new UserService(UserRepository);