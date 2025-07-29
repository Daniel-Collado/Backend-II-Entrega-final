// src/controllers/CartController.js
import CartService from '../services/CartService.js';
import UserService from '../services/UserService.js';

class CartController {
  // Obtener todos los carritos (solo admin)
    async getAllCarts(req, res) {
        try {
        const carts = await CartService.cartRepository.dao.find();
        res.json({ status: 'success', payload: carts });
        } catch (error) {
        console.error('Error al obtener carritos:', error);
        res.status(500).json({ status: 'error', message: 'Error en el servidor' });
        }
    }

    // Obtener un carrito por ID (dueño o admin)
    async getCartById(req, res) {
        try {
        const cart = await CartService.getCartById(req.params.cid);
        if (!cart) {
            return res.status(404).json({ status: 'error', message: 'Carrito no encontrado.' });
        }
        res.json({ status: 'success', payload: cart });
        } catch (error) {
        console.error('Error al obtener carrito por ID:', error);
        res.status(500).json({ status: 'error', message: 'Error en el servidor' });
        }
    }

    // Crear un nuevo carrito (cualquier usuario autenticado)
    async createCart(req, res) {
        try {
        const newCart = await CartService.createCart();
        // Asignar el carrito al usuario logueado
        await UserService.updateUserDetails(req.user._id, { cart: newCart._id });
        res.status(201).json({ status: 'success', payload: newCart });
        } catch (error) {
        console.error('Error al crear carrito:', error);
        res.status(500).json({ status: 'error', message: 'Error en el servidor' });
        }
    }

    // Agregar producto al carrito (solo usuario)
    async addProductToCart(req, res) {
        try {
        const { cid, pid } = req.params;
        const { quantity = 1 } = req.body;
        const updatedCart = await CartService.addProductToCart(cid, pid, quantity);
        res.json({ status: 'success', payload: updatedCart });
        } catch (error) {
        console.error('Error al añadir producto al carrito:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Error en el servidor' });
        }
    }

    // Completar la compra de un carrito (solo usuario)
    async completePurchase(req, res) {
        try {
        const cartId = req.params.cid;
        const purchaserEmail = req.user.email;
        const result = await CartService.completePurchase(cartId, purchaserEmail);
        res.json({ status: 'success', payload: result });
        } catch (error) {
        console.error('Error al completar la compra:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Error al procesar la compra.' });
        }
    }

    // Eliminar un producto del carrito (usuario o admin)
    async removeProductFromCart(req, res) {
        try {
        const { cid, pid } = req.params;
        const updatedCart = await CartService.removeProductFromCart(cid, pid);
        res.json({
            status: 'success',
            message: 'Producto eliminado del carrito exitosamente.',
            payload: updatedCart,
        });
        } catch (error) {
        console.error('Error al eliminar producto del carrito:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Error en el servidor al eliminar el producto del carrito.',
        });
        }
    }

    // Vaciar un carrito (dueño o admin)
    async clearCart(req, res) {
        try {
        const cartId = req.params.cid;
        await CartService.clearCart(cartId);
        res.json({ status: 'success', message: 'Carrito vaciado exitosamente.' });
        } catch (error) {
        console.error('Error al vaciar carrito:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Error en el servidor' });
        }
    }
}

export default new CartController();