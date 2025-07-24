import ProductDAO from '../daos/ProductDAO.js';

class ProductRepository {
    constructor(dao) {
        this.dao = dao;
    }

    async getAllProducts() {
        return await this.dao.find();
    }

    async getProductById(id) {
        return await this.dao.findById(id);
    }

    async createProduct(productData) {
        return await this.dao.create(productData);
    }

    async updateProduct(id, data) {
        return await this.dao.update(id, data);
    }

    async deleteProduct(id) {
        return await this.dao.delete(id);
    }

    async updateProductStock(id, quantityChange) {
        // quantityChange puede ser negativo para restar stock
        const product = await this.dao.findById(id);
        if (!product) {
            throw new Error('Producto no encontrado.');
        }
        if (product.stock + quantityChange < 0) {
            throw new Error('Stock insuficiente.');
        }
        return await this.dao.update(id, { $inc: { stock: quantityChange } });
    }
}

export default new ProductRepository(ProductDAO);
