import ProductRepository from '../repositories/ProductRepository.js';

class ProductService {
    constructor(productRepository) {
        this.productRepository = productRepository;
    }

    async getAllProducts(query = {}, page = 1, limit = 10) { // <- Se agregaron page y limit
        return await this.productRepository.getAllProducts(query, page, limit); // <- Se pasan a la capa de repositorio
    }

    async getProductById(id) {
        return await this.productRepository.getProductById(id);
    }

    async createProduct(productData) {
        const existingProduct = await this.productRepository.dao.findOne({ code: productData.code });
        if (existingProduct) {
            throw new Error('Ya existe un producto con este código. Por favor, usá otro.');
        }
        return await this.productRepository.createProduct(productData);
    }

    async updateProduct(id, data) {
        const updatedProduct = await this.productRepository.updateProduct(id, data);
        if (!updatedProduct) {
            throw new Error('Producto no encontrado para actualizar.');
        }
        return updatedProduct;
    }

    async deleteProduct(id) {
        const result = await this.productRepository.deleteProduct(id);
        if (result.deletedCount === 0) {
            throw new Error('Producto no encontrado para eliminar.');
        }
        return true;
    }
}

export default new ProductService(ProductRepository);