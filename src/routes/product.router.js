import { Router } from 'express';
import multer from 'multer';
import { isAuthenticated, authorizeRoles } from '../middlewares/auth.middleware.js';
import ProductController from '../controllers/ProductController.js';

const router = Router();
//const storage = multer.memoryStorage();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
        cb(null, true);
        } else {
        cb(new Error('Solo se permiten archivos de imagen.'), false);
        }
    },
});

// GET /api/products - Obtener todos los productos
router.get('/', ProductController.getAllProducts.bind(ProductController));

// GET /api/products/:pid - Obtener un producto por ID
router.get('/:pid', ProductController.getProductById.bind(ProductController));

// POST /api/products - Crear un nuevo producto (solo admin)
router.post('/', isAuthenticated, authorizeRoles('admin'), upload.single('thumbnail'), ProductController.createProduct.bind(ProductController));

// PUT /api/products/:pid - Actualizar un producto (solo admin)
router.put('/:pid', isAuthenticated, authorizeRoles('admin'), upload.single('thumbnail'), ProductController.updateProduct.bind(ProductController));

// DELETE /api/products/:pid - Eliminar un producto (solo admin)
router.delete('/:pid', isAuthenticated, authorizeRoles('admin'), ProductController.deleteProduct.bind(ProductController));

export default router;