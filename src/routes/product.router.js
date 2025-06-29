
import { Router } from 'express';
import productModel from '../models/product.model.js';
import passport from 'passport';

// Cloudinary para imagenes
import cloudinary from '../config/cloudinary.config.js';
import multer from 'multer';

const router = Router();

// Multer almacenamiento temporal en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Middleware 
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ status: 'error', message: 'Acceso denegado. Se requiere rol de administrador.' });
    }
};


// GET /api/products - Obtener todos los productos 
router.get('/', async (req, res) => {
    try {
        const products = await productModel.find().lean();
        res.json({ status: 'success', payload: products });
    } catch (error) {
        console.error("Error al obtener productos:", error);
        res.status(500).send("Error en el servidor");
    }
});

// GET /api/products/:pid - Obtener un producto por ID 
router.get('/:pid', async (req, res) => {
    const productId = req.params.pid;
    try {
        const product = await productModel.findById(productId).lean();
        if (!product) {
            return res.status(404).json({ status: 'error', message: 'Producto no encontrado.' });
        }
        res.json({ status: 'success', payload: product });
    } catch (error) {
        console.error("Error al obtener producto por ID:", error);
        res.status(500).send("Error en el servidor");
    }
});


// POST /api/products - Crear un nuevo producto (solo para admin)
router.post(
    '/',
    passport.authenticate('jwt', { session: false }),
    isAdmin, 
    upload.single('thumbnail'), 
    async (req, res) => {
        try {
            const { title, description, price, stock, category, code } = req.body;
            let thumbnailUrl = ''; 

            if (!title || !description || !price || !stock || !category || !code) {
                return res.status(400).json({ status: "error", message: "Faltan campos obligatorios para el producto." });
            }

            const existingProduct = await productModel.findOne({ code: code });
            if (existingProduct) {
                return res.status(400).json({ status: 'error', message: 'Ya existe un producto con este código. Por favor, usa otro.' });
            }

            // Subir imagen a Cloudinary
            if (req.file) {
                try {
                    const result = await cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`, {
                        folder: "products_thumbnails", 
                    });
                    thumbnailUrl = result.secure_url;
                    console.log('Imagen subida a Cloudinary:', thumbnailUrl);
                } catch (cloudinaryError) {
                    console.error("Error al subir imagen a Cloudinary:", cloudinaryError);
                    return res.status(500).json({ status: "error", message: "Error al subir la imagen." });
                }
            }

            // Crear el objeto del nuevo producto
            const newProductData = {
                title,
                description,
                price: Number(price),
                stock: Number(stock),
                category,
                code,
                thumbnail: thumbnailUrl, 
            };

            // Guardar en la base de datos
            const createdProduct = await productModel.create(newProductData);

            res.status(201).json({ status: "success", message: "Producto creado exitosamente.", product: createdProduct });

        } catch (error) {
            console.error("Error en la ruta POST /api/products:", error);
            res.status(500).json({ status: "error", message: "Error interno del servidor al crear el producto." });
        }
    }
);

// PUT /api/products/:pid - Actualizar un producto 
router.put('/:pid', passport.authenticate('jwt', { session: false }), isAdmin, async (req, res) => {
    const productId = req.params.pid;
    const updateData = req.body;
    try {
        const updatedProduct = await productModel.findByIdAndUpdate(productId, updateData, { new: true }).lean();
        if (!updatedProduct) {
            return res.status(404).json({ status: 'error', message: 'Producto no encontrado para actualizar.' });
        }
        res.json({ status: 'success', payload: updatedProduct });
    } catch (error) {
        console.error("Error al actualizar producto:", error);
        res.status(500).send("Error en el servidor");
    }
});

// DELETE /api/products/:pid - Eliminar un producto
router.delete('/:pid', passport.authenticate('jwt', { session: false }), isAdmin, async (req, res) => {
    const productId = req.params.pid;
    try {
        const result = await productModel.deleteOne({ _id: productId });
        if (result.deletedCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Producto no encontrado para eliminar.' });
        }
        res.json({ status: 'success', message: 'Producto eliminado exitosamente.' });
    } catch (error) {
        console.error("Error al eliminar producto:", error);
        res.status(500).send("Error en el servidor");
    }
});

export default router;