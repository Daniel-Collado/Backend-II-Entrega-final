import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
        maxPoolSize: 10, // Mantén el pool
        serverSelectionTimeoutMS: 5000, // Mantén el timeout
        });
        console.log('Conectado a MongoDB');
    } catch (err) {
        console.error('Error al conectar a MongoDB:', err);
        process.exit(1);
    }

    mongoose.connection.on('disconnected', () => {
        console.log('MongoDB desconectado, intentando reconectar...');
        connectDB();
    });

    process.on('SIGTERM', async () => {
        await mongoose.connection.close();
        console.log('Conexión a MongoDB cerrada');
        process.exit(0);
    });

    process.on('SIGINT', async () => {
        await mongoose.connection.close();
        console.log('Conexión a MongoDB cerrada');
        process.exit(0);
    });
};

export default connectDB;