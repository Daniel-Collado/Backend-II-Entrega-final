import { Router } from 'express';
import CartService from '../services/CartService.js';
import UserService from '../services/UserService.js'; 
import { isAuthenticated, authorizeRoles, isCartOwnerOrAdmin as createIsCartOwnerOrAdminMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

const isCartOwnerOrAdmin = createIsCartOwnerOrAdminMiddleware(CartService, UserService);

// GET /api/carts - Obtener todos los carritos (sólo admin)
router.get('/', isAuthenticated, authorizeRoles('admin'), async (req, res) => {
    try {
        const carts = await CartService.cartRepository.dao.find();
        res.json({ status: 'success', payload: carts });
    } catch (error) {
        console.error("Error al obtener carritos:", error);
        res.status(500).send("Error en el servidor");
    }
});

// GET /api/carts/:cid - Obtener un carrito por ID (dueño o admin)
router.get('/:cid', isAuthenticated, isCartOwnerOrAdmin, async (req, res) => {
    const cartId = req.params.cid;
    try {
        const cart = await CartService.getCartById(cartId);
        if (!cart) {
            return res.status(404).json({ status: 'error', message: 'Carrito no encontrado.' });
        }
        res.json({ status: 'success', payload: cart });
    } catch (error) {
        console.error("Error al obtener carrito por ID:", error);
        res.status(500).send("Error en el servidor");
    }
});

// POST /api/carts - Crear un nuevo carrito (cualquier usuario autenticado)
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const newCart = await CartService.createCart();
        // Asignar el carrito al usuario logueado
        await UserService.updateUserDetails(req.user._id, { cart: newCart._id });
        res.status(201).json({ status: 'success', payload: newCart });
    } catch (error) {
        console.error("Error al crear carrito:", error);
        res.status(500).send("Error en el servidor");
    }
});

// POST /api/carts/:cid/products/:pid - Agregar un producto al carrito (sólo usuario)
router.post('/:cid/products/:pid', isAuthenticated, authorizeRoles('user'), isCartOwnerOrAdmin, async (req, res) => {
    const { cid, pid } = req.params;
    const { quantity = 1 } = req.body;

    try {
        const updatedCart = await CartService.addProductToCart(cid, pid, quantity);
        res.json({ status: 'success', payload: updatedCart });
    } catch (error) {
        console.error("Error al añadir producto al carrito:", error);
        res.status(500).json({ status: 'error', message: error.message || "Error en el servidor" });
    }
});

// Ruta para completar la compra de un carrito
router.post('/:cid/purchase', isAuthenticated, authorizeRoles('user'), isCartOwnerOrAdmin, async (req, res) => {
    const cartId = req.params.cid;
    const purchaserEmail = req.user.email;

    try {
        const result = await CartService.completePurchase(cartId, purchaserEmail);
        res.json({ status: 'success', payload: result });
    } catch (error) {
        console.error("Error al completar la compra:", error);
        res.status(500).json({ status: 'error', message: error.message || "Error al procesar la compra." });
    }
});

// DELETE /api/carts/:cid/products/:pid - Elimina un producto específico del carrito (sólo usuario o admin)
router.delete('/:cid/products/:pid', isAuthenticated, authorizeRoles('user', 'admin'), isCartOwnerOrAdmin, async (req, res) => {
    const { cid, pid } = req.params;
    try {
        const updatedCart = await CartService.removeProductFromCart(cid, pid);
        res.json({ status: 'success', message: 'Producto eliminado del carrito exitosamente.', payload: updatedCart });
    } catch (error) {
        console.error("Error al eliminar producto del carrito:", error);
        res.status(500).json({ status: 'error', message: error.message || "Error en el servidor al eliminar el producto del carrito." });
    }
});


// Ruta para completar la compra de un carrito
router.post('/:cid/purchase', isAuthenticated, authorizeRoles('user'), isCartOwnerOrAdmin, async (req, res) => {
    const cartId = req.params.cid;
    const purchaserEmail = req.user.email;

    try {
        const result = await CartService.completePurchase(cartId, purchaserEmail);
        res.json({ status: 'success', payload: result });
    } catch (error) {
        console.error("Error al completar la compra:", error);
        res.status(500).json({ status: 'error', message: error.message || "Error al procesar la compra." });
    }
});

// DELETE /api/carts/:cid - Eliminar un carrito (sólo admin o dueño)
router.delete('/:cid', isAuthenticated, isCartOwnerOrAdmin, async (req, res) => {
    const cartId = req.params.cid;
    try {
        await CartService.clearCart(cartId); 
        // Para eliminar el carrito y desasociarlo del usuario:
        // await CartService.cartRepository.delete(cartId);
        // await UserService.updateUserDetails(req.user._id, { cart: null });
        res.json({ status: 'success', message: 'Carrito vaciado exitosamente.' });
    } catch (error) {
        console.error("Error al eliminar carrito:", error);
        res.status(500).json({ status: 'error', message: error.message || "Error en el servidor" });
    }
});

export default router;