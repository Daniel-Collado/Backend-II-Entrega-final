import UserDAO from '../daos/UserDAO.js';
import UserDTO from '../dtos/UserDTO.js';

class UserRepository {
    constructor(dao) {
        this.dao = dao;
    }

    async getUserById(id) {
        const user = await this.dao.findById(id);
        return user ? new UserDTO(user) : null;
    }

    async getUserByEmail(email) {
        const user = await this.dao.findOne({ email });
        return user ? new UserDTO(user) : null;
    }

    async createUser(userData) {
        const newUser = await this.dao.create(userData);
        return new UserDTO(newUser);
    }

    async updateUser(id, data) {
        const updatedUser = await this.dao.update(id, data);
        return updatedUser ? new UserDTO(updatedUser) : null;
    }

    async deleteUser(id) {
        return await this.dao.delete(id);
    }

    async findUserRaw(query) {
        // Usuario completo (incluye password)
        return await this.dao.findOneRaw(query);
    }

    async updateUserRaw(id, data) {
        // Actualizar el objeto de usuario completo (incluye password)
        return await this.dao.update(id, data);
    }
}

export default new UserRepository(UserDAO);