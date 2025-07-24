import { Router } from 'express';
import ProductService from '../services/ProductService.js';
import { isAuthenticated, authorizeRoles } from '../middlewares/auth.middleware.js';

// Cloudinary
import cloudinary from '../config/cloudinary.config.js';
import multer from 'multer';

const router = Router();

// Almacenamiento temporal
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


// GET /api/products - Obtener todos los productos
router.get('/', async (req, res) => {
    try {
        const products = await ProductService.getAllProducts();
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
        const product = await ProductService.getProductById(productId);
        if (!product) {
            return res.status(404).json({ status: 'error', message: 'Producto no encontrado.' });
        }
        res.json({ status: 'success', payload: product });
    } catch (error) {
        console.error("Error al obtener producto por ID:", error);
        res.status(500).send("Error en el servidor");
    }
});


// POST /api/products - Crear un nuevo producto (sólo admin)
router.post(
    '/',
    isAuthenticated, 
    authorizeRoles('admin'), 
    upload.single('thumbnail'),
    async (req, res) => {
        try {
            const { title, description, price, stock, category, code } = req.body;
            let thumbnailUrl = '';

            if (!title || !description || !price || !stock || !category || !code) {
                return res.status(400).json({ status: "error", message: "Faltan campos obligatorios para el producto." });
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

            const newProductData = {
                title,
                description,
                price: Number(price),
                stock: Number(stock),
                category,
                code,
                thumbnail: thumbnailUrl,
            };

            const createdProduct = await ProductService.createProduct(newProductData);

            res.status(201).json({ status: "success", message: "Producto creado exitosamente.", product: createdProduct });

        } catch (error) {
            console.error("Error en la ruta POST /api/products:", error);
            res.status(500).json({ status: "error", message: error.message || "Error interno del servidor al crear el producto." });
        }
    }
);

// PUT /api/products/:pid - Actualizar un producto (solo admin)
router.put('/:pid', isAuthenticated, authorizeRoles('admin'), async (req, res) => {
    const productId = req.params.pid;
    const updateData = req.body;
    try {
        const updatedProduct = await ProductService.updateProduct(productId, updateData);
        res.json({ status: 'success', payload: updatedProduct });
    } catch (error) {
        console.error("Error al actualizar producto:", error);
        res.status(500).json({ status: 'error', message: error.message || "Error en el servidor al actualizar el producto." });
    }
});

// DELETE /api/products/:pid - Eliminar un producto (sólo admin)
router.delete('/:pid', isAuthenticated, authorizeRoles('admin'), async (req, res) => {
    const productId = req.params.pid;
    try {
        await ProductService.deleteProduct(productId);
        res.json({ status: 'success', message: 'Producto eliminado exitosamente.' });
    } catch (error) {
        console.error("Error al eliminar producto:", error);
        res.status(500).json({ status: 'error', message: error.message || "Error en el servidor al eliminar el producto." });
    }
});

export default router;