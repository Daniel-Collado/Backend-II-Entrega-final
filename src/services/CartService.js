import CartRepository from '../repositories/CartRepository.js';
import ProductRepository from '../repositories/ProductRepository.js';
import TicketService from './TicketService.js';

class CartService {
    constructor(cartRepository, productRepository, ticketService) {
        this.cartRepository = cartRepository;
        this.productRepository = productRepository;
        this.ticketService = ticketService;
    }

    async getCartById(id) {
        return await this.cartRepository.getCartById(id);
    }

    async createCart() {
        return await this.cartRepository.createCart();
    }

    async addProductToCart(cartId, productId, quantity) {
        const cart = await this.cartRepository.getCartById(cartId);
        const product = await this.productRepository.getProductById(productId);
        if (!product) {
            throw new Error('Producto no encontrado.');
        }

        const cartProduct = cart.products.find(item => item.product._id.toString() === productId);
        const currentQuantityInCart = cartProduct ? cartProduct.quantity : 0;
        const totalQuantity = currentQuantityInCart + quantity;

        if (product.stock < totalQuantity) {
            throw new Error(`Stock insuficiente para el producto ${product.title}. Stock disponible: ${product.stock}`);
        }
        return await this.cartRepository.addProductToCart(cartId, productId, quantity);
    }

    async removeProductFromCart(cartId, productId) {
        return await this.cartRepository.removeProductFromCart(cartId, productId);
    }

    async clearCart(cartId) {
        return await this.cartRepository.clearCart(cartId);
    }

    async completePurchase(cartId, purchaserEmail) {
        const cart = await this.cartRepository.getCartById(cartId);
        if (!cart) {
            throw new Error('Carrito no encontrado.');
        }

        const productsToPurchase = [];
        const productsNotPurchased = [];
        let totalAmount = 0;

        for (const item of cart.products) {
            const product = await this.productRepository.getProductById(item.product._id);

            if (!product || product.stock < item.quantity) {
                productsNotPurchased.push(item); // Producto no disponible o stock insuficiente
            } else {
                // Actualizar stock
                await this.productRepository.updateProductStock(product._id, -item.quantity);
                productsToPurchase.push({
                    product: product,
                    quantity: item.quantity,
                    price: product.price
                });
                totalAmount += product.price * item.quantity;
            }
        }

        let ticket = null;
        if (productsToPurchase.length > 0) {
            try {
                const rawTicket = await this.ticketService.createTicket(totalAmount, purchaserEmail, productsToPurchase);
                
                if (rawTicket && typeof rawTicket.toObject === 'function') {
                    ticket = rawTicket.toObject();
                } else if (rawTicket) {
                    ticket = rawTicket;
                } else {
                    console.error('TicketService.createTicket devolvió null/undefined inesperadamente.');
                    ticket = null;
                }
                
            } catch (ticketError) {
                console.error('Error al crear el ticket en completePurchase:', ticketError);
                ticket = null;
            }
        }

        // Actualizar el carrito con los productos que no se pudieron comprar
        await this.cartRepository.updateCartProducts(cartId, productsNotPurchased);

        return {
            ticket: ticket,
            productsNotPurchased: productsNotPurchased,
            message: productsToPurchase.length > 0
                ? (productsNotPurchased.length > 0
                    ? 'Compra completada parcialmente. Algunos productos no pudieron ser procesados por falta de stock.'
                    : 'Compra completada exitosamente.')
                : 'No se pudo procesar ningún producto del carrito por falta de stock.'
        };
    }
}

export default new CartService(CartRepository, ProductRepository, TicketService);