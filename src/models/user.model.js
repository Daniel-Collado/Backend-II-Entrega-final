import mongoose from 'mongoose';

const userCollection = 'users';

const userSchema = new mongoose.Schema({
    first_name: {
        type: String, 
        required: true,
    },
    last_name: {
        type: String, 
        required: true,
    },
    email:  {
        type: String, 
        required: true, 
        unique: true,
        index: true
    },
    age: { 
        type: Number,
        required: true,
    },
    password:  {
        type: String,
        required: true
    },
    cart: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'carts', 
        default: null 
    },
    role:  {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    resetPasswordToken: { 
        type: String,
        default: null, 
        trim: true 
    },
    resetPasswordExpires: { 
        type: Date,
        default: null 
    }
})

const userModel = mongoose.model(userCollection, userSchema);

export default userModel;