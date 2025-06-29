import mongoose from 'mongoose';

const cartCollection = 'carts'; // nombre de la colección

const cartSchema = new mongoose.Schema({
    products: { 
        type: [{
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'products', 
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                default: 1
            }
        }],
        default: []
    }
    // Agregar después: más campos, totalPrice, userId, etc.
});

cartSchema.pre('findOne', function () {
    this.populate('products.product');
});
cartSchema.pre('find', function () {
    this.populate('products.product');
});

const cartModel = mongoose.model(cartCollection, cartSchema);

export default cartModel;