import userModel from '../models/user.model.js';

class UserDAO {
    async findById(id) {
        return await userModel.findById(id).lean();
    }

    async findOne(query) {
        return await userModel.findOne(query).lean();
    }

    async findOneRaw(query) {
        console.log('DEBUG (UserDAO): Ejecutando findOneRaw con query:', query); // Log de la consulta
        return await userModel.findOne(query);
    }

    async create(data) {
        return await userModel.create(data);
    }

    async update(id, data) {
        return await userModel.findByIdAndUpdate(id, data, { new: true });
    }

    async delete(id) {
        return await userModel.deleteOne({ _id: id });
    }
}

export default new UserDAO();
