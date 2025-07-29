import CartDAO from '../daos/CartDAO.js';

class CartRepository {
    constructor(dao) {
        this.dao = dao;
    }

    async getCartById(id) {
        return await this.dao.findById(id);
    }

    async createCart() {
        return await this.dao.create();
    }

    async addProductToCart(cartId, productId, quantity) {
        const cart = await this.dao.findById(cartId);
        if (!cart) {
            throw new Error('Carrito no encontrado.');
        }

        const productIndex = cart.products.findIndex(item => item.product._id.toString() === productId);

        if (productIndex > -1) {
            cart.products[productIndex].quantity += quantity;
        } else {
            cart.products.push({ product: productId, quantity });
        }

        return await this.dao.update(cartId, { products: cart.products });
    }

    async removeProductFromCart(cartId, productId) {
        const cart = await this.dao.findById(cartId);
        if (!cart) {
            throw new Error('Carrito no encontrado.');
        }

        cart.products = cart.products.filter(item => item.product._id.toString() !== productId);
        return await this.dao.update(cartId, { products: cart.products });
    }

    async clearCart(cartId) {
        return await this.dao.update(cartId, { products: [] });
    }

    async updateCartProducts(cartId, products) {
        //Actualizar los productos de un carrito
        return await this.dao.update(cartId, { products: products });
    }
}

export default new CartRepository(CartDAO);