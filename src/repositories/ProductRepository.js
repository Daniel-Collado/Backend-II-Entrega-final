// src/repositories/ProductRepository.js
import ProductDAO from '../daos/ProductDAO.js';

class ProductRepository {
    constructor(dao) {
        this.dao = dao;
    }

    // Se cambió de this.dao.find(query) a this.dao.paginate(query, { page, limit })
    async getAllProducts(query = {}, page = 1, limit = 10) {
        return await this.dao.paginate(query, { page, limit, lean: true });
    }

    async getProductById(id) {
        return await this.dao.findById(id);
    }

    async createProduct(productData) {
        return await this.dao.createProduct(productData);
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