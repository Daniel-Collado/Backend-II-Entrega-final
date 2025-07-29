import ProductService from '../services/ProductService.js';
import cloudinary from '../config/cloudinary.config.js';

class ProductController {
    constructor(productService) {
        this.productService = productService;
    }

    // Obtener todos los productos
    async getAllProducts(req, res) {
        try {
        const products = await this.productService.getAllProducts();
        res.json({ status: 'success', payload: products });
        } catch (error) {
        console.error('Error en ProductController.getAllProducts:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Error interno del servidor al obtener productos.' });
        }
    }

    // Obtener un producto por ID
    async getProductById(req, res) {
        const productId = req.params.pid;
        try {
        const product = await this.productService.getProductById(productId);
        if (!product) {
            return res.status(404).json({ status: 'error', message: 'Producto no encontrado.' });
        }
        res.json({ status: 'success', payload: product });
        } catch (error) {
        console.error('Error en ProductController.getProductById:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Error interno del servidor al obtener el producto.' });
        }
    }

    // Crear un nuevo producto
    async createProduct(req, res) {
        const { title, description, code, price, stock, category } = req.body;
        const thumbnail = req.file;

        if (!title || !description || !code || !price || !stock || !category) {
        return res.status(400).json({ status: 'error', message: 'Faltan campos obligatorios para crear el producto.' });
        }

        try {
        let thumbnailUrl = '';
        if (thumbnail) {
            const uploadResult = await cloudinary.uploader.upload(`data:${thumbnail.mimetype};base64,${thumbnail.buffer.toString('base64')}`, {
            folder: 'thumbnails',
            });
            thumbnailUrl = uploadResult.secure_url;
        }

        const productData = {
            title,
            description,
            code,
            price: parseFloat(price),
            stock: parseInt(stock, 10),
            category,
            thumbnail: thumbnailUrl ? [thumbnailUrl] : [],
        };

        const createdProduct = await this.productService.createProduct(productData);
        res.status(201).json({ status: 'success', message: 'Producto creado exitosamente.', product: createdProduct });
        } catch (error) {
        console.error('Error en ProductController.createProduct:', error);
        if (error.message.includes('Ya existe un producto con este código')) {
            return res.status(409).json({ status: 'error', message: error.message });
        }
        res.status(500).json({ status: 'error', message: error.message || 'Error interno del servidor al crear el producto.' });
        }
    }

    // Actualizar un producto existente
    async updateProduct(req, res) {
        const productId = req.params.pid;
        const { title, description, code, price, stock, category, thumbnail } = req.body;
        const newThumbnail = req.file;

        try {
        let thumbnailUrl = thumbnail || [];
        if (newThumbnail) {
            const uploadResult = await cloudinary.uploader.upload(`data:${newThumbnail.mimetype};base64,${newThumbnail.buffer.toString('base64')}`, {
            folder: 'thumbnails',
            });
            thumbnailUrl = [uploadResult.secure_url];
        }

        const updateData = {
            title,
            description,
            code,
            price: price ? parseFloat(price) : undefined,
            stock: stock ? parseInt(stock, 10) : undefined,
            category,
            thumbnail: thumbnailUrl,
        };

        // Filtrar campos undefined
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

        const updatedProduct = await this.productService.updateProduct(productId, updateData);
        if (!updatedProduct) {
            return res.status(404).json({ status: 'error', message: 'Producto no encontrado.' });
        }
        res.json({ status: 'success', payload: updatedProduct });
        } catch (error) {
        console.error('Error en ProductController.updateProduct:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Error interno del servidor al actualizar el producto.' });
        }
    }

    // Eliminar un producto
    async deleteProduct(req, res) {
        const productId = req.params.pid;
        try {
        const deleted = await this.productService.deleteProduct(productId);
        if (!deleted) {
            return res.status(404).json({ status: 'error', message: 'Producto no encontrado.' });
        }
        res.json({ status: 'success', message: 'Producto eliminado exitosamente.' });
        } catch (error) {
        console.error('Error en ProductController.deleteProduct:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Error interno del servidor al eliminar el producto.' });
        }
    }
}

export default new ProductController(ProductService);