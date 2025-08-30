// src/controllers/ProductController.js
import ProductService from '../services/ProductService.js';
import cloudinary from '../config/cloudinary.config.js';
import { Readable } from 'stream';

class ProductController {
    constructor(productService) {
        this.productService = productService;
    }

    async getAllProducts(req, res) {
        try {
            const { search, category, page = 1, limit = 10 } = req.query;
            const query = {};

            // Búsqueda por título o descripción
            if (search && search.trim()) {
                const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
                query.$or = [
                    { title: { $regex: searchRegex } },
                    { description: { $regex: searchRegex } }
                ];
                console.log('Search regex creado:', searchRegex);
            }

            // Filtrado por categoría (coincidencia parcial en categorías múltiples)
            if (category && category.trim()) {
                const categoryRegex = new RegExp(category.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
                query.category = { $regex: categoryRegex };
                console.log('Category regex creado:', categoryRegex);
            }
            
            console.log('Query enviado a ProductService:', JSON.stringify(query, null, 2));
            
            // Obtener los productos filtrados y paginados
            const { docs: products, totalPages, prevPage, nextPage, page: currentPage, hasPrevPage, hasNextPage } = await this.productService.getAllProducts(query, parseInt(page), parseInt(limit));

            // Obtener categorías únicas de todos los productos
            // Se corrigió para acceder a 'docs' antes de usar flatMap
            const { docs: allProducts } = await this.productService.getAllProducts({}, 1, 1000); 
            const categories = [...new Set(
                allProducts
                    .flatMap(product => product.category.split(',').map(cat => cat.trim()))
                    .map(cat => cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase())
            )].sort();
            
            console.log('Categorías devueltas:', categories);

            res.json({ 
                status: 'success', 
                payload: { 
                    products, 
                    categories,
                    totalPages,
                    prevPage,
                    nextPage,
                    page: currentPage,
                    hasPrevPage,
                    hasNextPage
                } 
            });
        } catch (error) {
            console.error('Error en ProductController.getAllProducts:', error);
            res.status(500).json({ status: 'error', message: error.message || 'Error interno del servidor al obtener productos.' });
        }
    }

    // Resto del código (sin cambios)
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

    async createProduct(req, res) {
        const { title, description, code, price, stock, category } = req.body;
        const thumbnail = req.file;

        if (!title || !description || !code || !price || !stock || !category) {
            return res.status(400).json({ status: 'error', message: 'Faltan campos obligatorios para crear el producto.' });
        }

        try {
            let thumbnailUrl = '';
            if (thumbnail) {
                thumbnailUrl = await new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        { folder: 'thumbnails' },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result.secure_url);
                        }
                    );
                    const bufferStream = Readable.from(thumbnail.buffer);
                    bufferStream.pipe(uploadStream);
                }).catch((error) => {
                    throw new Error(`Error al subir a Cloudinary: ${error.message}`);
                });
                console.log('URL de Cloudinary obtenida:', thumbnailUrl);
            }

            const productData = {
                title,
                description,
                code,
                price: parseFloat(price),
                stock: parseInt(stock, 10),
                category,
                thumbnail: thumbnailUrl ? [thumbnailUrl] : []
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

    async updateProduct(req, res) {
        const productId = req.params.pid;
        const { title, description, code, price, stock, category, thumbnail } = req.body;
        const newThumbnail = req.file;

        try {
            let thumbnailUrl = thumbnail || [];
            if (newThumbnail) {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: 'thumbnails' },
                    (error, result) => {
                        if (error) throw error;
                        thumbnailUrl = [result.secure_url];
                    }
                );
                const bufferStream = Readable.from(newThumbnail.buffer);
                bufferStream.pipe(uploadStream);

                await new Promise((resolve, reject) => {
                    uploadStream.on('finish', resolve);
                    uploadStream.on('error', reject);
                });
            }

            const updateData = {
                title,
                description,
                code,
                price: price ? parseFloat(price) : undefined,
                stock: stock ? parseInt(stock, 10) : undefined,
                category,
                thumbnail: thumbnailUrl
            };

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