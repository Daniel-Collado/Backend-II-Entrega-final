
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from './src/config/index.js';

export const createHash = (password) => {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
};

export const isValidPassword = (password, hashedPassword) => {
    return bcrypt.compareSync(password, hashedPassword);
};

export const generateToken = (user) => {
    const token = jwt.sign({ user }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRATION_TIME });
    return token;
};