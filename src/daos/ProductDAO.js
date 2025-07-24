import productModel from '../models/product.model.js';

class ProductDAO {
    async find() {
        return await productModel.find().lean();
    }

    async findById(id) {
        return await productModel.findById(id).lean();
    }

    async findOne(query) {
        return await productModel.findOne(query).lean();
    }

    async create(data) {
        return await productModel.create(data);
    }

    async update(id, data) {
        return await productModel.findByIdAndUpdate(id, data, { new: true }).lean();
    }

    async delete(id) {
        return await productModel.deleteOne({ _id: id });
    }
}

export default new ProductDAO();
