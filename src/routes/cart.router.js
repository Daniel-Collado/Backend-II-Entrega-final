import { Router } from 'express';
import CartController from '../controllers/CartController.js';
import UserService from '../services/UserService.js';
import CartService from '../services/CartService.js';
import { isAuthenticated, authorizeRoles, isCartOwnerOrAdmin as createIsCartOwnerOrAdminMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();
const isCartOwnerOrAdmin = createIsCartOwnerOrAdminMiddleware(CartService, UserService);

// GET /api/carts - Obtener todos los carritos (solo admin)
router.get('/', isAuthenticated, authorizeRoles('admin'), CartController.getAllCarts.bind(CartController));

// GET /api/carts/:cid - Obtener un carrito por ID (dueño o admin)
router.get('/:cid', isAuthenticated, isCartOwnerOrAdmin, CartController.getCartById.bind(CartController));

// POST /api/carts - Crear un nuevo carrito (cualquier usuario autenticado)
router.post('/', isAuthenticated, CartController.createCart.bind(CartController));

// POST /api/carts/:cid/products/:pid - Agregar producto al carrito (solo usuario)
router.post('/:cid/products/:pid', isAuthenticated, authorizeRoles('user'), isCartOwnerOrAdmin, CartController.addProductToCart.bind(CartController));

// POST /api/carts/:cid/purchase - Completar compra (solo usuario)
router.post('/:cid/purchase', isAuthenticated, authorizeRoles('user'), isCartOwnerOrAdmin, CartController.completePurchase.bind(CartController));

// DELETE /api/carts/:cid/products/:pid - Eliminar producto del carrito (usuario o admin)
router.delete('/:cid/products/:pid', isAuthenticated, authorizeRoles('user', 'admin'), isCartOwnerOrAdmin, CartController.removeProductFromCart.bind(CartController));

// DELETE /api/carts/:cid - Vaciar carrito (dueño o admin)
router.delete('/:cid', isAuthenticated, isCartOwnerOrAdmin, CartController.clearCart.bind(CartController));

export default router;