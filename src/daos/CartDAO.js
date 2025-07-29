import cartModel from '../models/cart.model.js';

class CartDAO {
    async findById(id) {
        return await cartModel.findById(id).lean();
    }

    async create(data = {}) {
        return await cartModel.create(data);
    }

    async update(id, data) {
        return await cartModel.findByIdAndUpdate(id, data, { new: true }).lean();
    }

    async delete(id) {
        return await cartModel.deleteOne({ _id: id });
    }
}

export default new CartDAO();