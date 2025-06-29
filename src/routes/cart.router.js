
import { Router } from 'express';
import cartModel from '../models/cart.model.js';
import userModel from '../models/user.model.js';
import passport from 'passport'; 

const router = Router();

// Middleware admin
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ status: 'error', message: 'Acceso denegado. Se requiere rol de administrador.' });
    }
};

// Middleware carrito
const isCartOwnerOrAdmin = async (req, res, next) => {
    const cartId = req.params.cid || req.body.cartId; 
    const userId = req.user._id;

    if (req.user.role === 'admin') {
        return next(); 
    }

    try {
        const user = await userModel.findById(userId);
        if (!user || user.cart.toString() !== cartId) {
            return res.status(403).json({ status: 'error', message: 'Acceso denegado. No eres el propietario de este carrito.' });
        }
        next();
    } catch (error) {
        console.error("Error al verificar propietario del carrito:", error);
        res.status(500).json({ status: 'error', message: 'Error interno del servidor al verificar acceso al carrito.' });
    }
};


// GET /api/carts - Obtener todos los carritos (solo admin)
router.get('/', passport.authenticate('jwt', { session: false }), isAdmin, async (req, res) => {
    try {
        const carts = await cartModel.find().lean();
        res.json({ status: 'success', payload: carts });
    } catch (error) {
        console.error("Error al obtener carritos:", error);
        res.status(500).send("Error en el servidor");
    }
});

// GET /api/carts/:cid - Obtener un carrito por ID (dueño o admin)
router.get('/:cid', passport.authenticate('jwt', { session: false }), isCartOwnerOrAdmin, async (req, res) => {
    const cartId = req.params.cid;
    try {
        const cart = await cartModel.findById(cartId).lean();
        if (!cart) {
            return res.status(404).json({ status: 'error', message: 'Carrito no encontrado.' });
        }
        res.json({ status: 'success', payload: cart });
    } catch (error) {
        console.error("Error al obtener carrito por ID:", error);
        res.status(500).send("Error en el servidor");
    }
});

// POST /api/carts - Crear un nuevo carrito
router.post('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const newCart = await cartModel.create({}); // carrito vacío
        await userModel.findByIdAndUpdate(req.user._id, { cart: newCart._id });
        res.status(201).json({ status: 'success', payload: newCart });
    } catch (error) {
        console.error("Error al crear carrito:", error);
        res.status(500).send("Error en el servidor");
    }
});

// POST /api/carts/:cid/products/:pid - Agregar un producto al carrito
router.post('/:cid/products/:pid', passport.authenticate('jwt', { session: false }), isCartOwnerOrAdmin, async (req, res) => {
    const { cid, pid } = req.params;
    const { quantity = 1 } = req.body; 

    try {
        const cart = await cartModel.findById(cid);
        if (!cart) {
            return res.status(404).json({ status: 'error', message: 'Carrito no encontrado.' });
        }

        const productIndex = cart.products.findIndex(item => item.product.toString() === pid);

        if (productIndex > -1) {
            // actualiza la cantidad
            cart.products[productIndex].quantity += quantity;
        } else {
            // si no existe, agrega el nuevo producto
            cart.products.push({ product: pid, quantity });
        }

        await cart.save();
        res.json({ status: 'success', payload: cart });
    } catch (error) {
        console.error("Error al añadir producto al carrito:", error);
        res.status(500).send("Error en el servidor");
    }
});

// DELETE /api/carts/:cid - Eliminar un carrito (solo admin o dueño)
router.delete('/:cid', passport.authenticate('jwt', { session: false }), isCartOwnerOrAdmin, async (req, res) => {
    const cartId = req.params.cid;
    try {
        const result = await cartModel.deleteOne({ _id: cartId });
        if (result.deletedCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Carrito no encontrado para eliminar.' });
        }
        await userModel.findOneAndUpdate({ cart: cartId }, { $set: { cart: null } });

        res.json({ status: 'success', message: 'Carrito eliminado exitosamente.' });
    } catch (error) {
        console.error("Error al eliminar carrito:", error);
        res.status(500).send("Error en el servidor");
    }
});

export default router;