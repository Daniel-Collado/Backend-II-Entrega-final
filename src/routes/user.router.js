
import { Router } from 'express';
import userModel from '../models/user.model.js';
import passport from 'passport'; 

const router = Router();

router.get('/', passport.authenticate('jwt', { session: false }), async(req, res) =>{

    // if (req.user.role !== 'admin') {
    //     return res.status(403).json({ status: "error", message: "Acceso denegado. Se requiere rol de administrador." });
    // }
    try{
        const users = await userModel.find().lean(); 
        users.forEach(user => delete user.password);
        res.json({ status:"success", payload: users });
    } catch(error) {
        console.error("Error al obtener usuarios:", error);
        res.status(500).send("Error en el servidor");
    }
});

// GET /api/users/:pid 
router.get('/:pid', passport.authenticate('jwt', { session: false }), async(req, res) => {
    const id = req.params.pid;
    try {
        const user = await userModel.findById(id).lean();
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Usuario no encontrado.' });
        }
        delete user.password; // No devolver la contraseña
        res.json({ status: 'success', payload: user});
    } catch(error) {
        console.error("Error al obtener usuario por ID:", error);
        res.status(500).send("Error en el servidor");
    }
});

// POST /api/users 

router.post('/', passport.authenticate('jwt', { session: false }), async(req, res) => {
    
    // if (req.user.role !== 'admin') {
    //     return res.status(403).json({ status: "error", message: "Acceso denegado. Se requiere rol de administrador." });
    // }
    try{
        const { first_name, last_name, email, age, password, role } = req.body;
        if (!first_name || !last_name || !email || !age || !password) {
            return res.status(400).json({ status: 'error', message: 'Faltan campos requeridos: first_name, last_name, email, age, password.' });
        }
        // Si el email ya existe
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ status: 'error', message: 'El email ya está registrado.' });
        }

        // Hashear la pass
        const hashedPassword = await createHash(password); 
        const newUser = await userModel.create({
            first_name,
            last_name,
            email,
            age,
            password: hashedPassword,
            role: role || 'user' 
        });
        delete newUser.password; 
        res.status(201).json({ status: 'success', payload: newUser._id, user: newUser });
    } catch(error) {
        console.error("Error al crear usuario:", error);
        res.status(500).send("Error en el servidor");
    }
});

// PUT /api/users/:pid 
router.put('/:pid', passport.authenticate('jwt', { session: false }), async(req, res) => {
    const id = req.params.pid;
    // if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
    //     return res.status(403).json({ status: "error", message: "Acceso denegado. No puedes modificar este usuario." });
    // }
    try {
        const { password, ...updateData } = req.body; // Excluye password si no se quiere actualizar aquí

        if (password) {
            updateData.password = createHash(password); // 
        }

        const result = await userModel.updateOne({ '_id': id }, { $set: updateData });
        if (result.matchedCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Usuario no encontrado para actualizar.' });
        }
        res.json({ status: 'success', payload: result});
    } catch(error) {
        console.error("Error al actualizar usuario:", error);
        res.status(500).send("Error en el servidor");
    }
});

// DELETE /api/users/:pid 
router.delete('/:pid', passport.authenticate('jwt', { session: false }), async(req, res) => {
    const id = req.params.pid;
    // Opcional: solo administradores pueden eliminar usuarios
    // if (req.user.role !== 'admin') {
    //     return res.status(403).json({ status: "error", message: "Acceso denegado. Se requiere rol de administrador." });
    // }
    try {
        const result = await userModel.deleteOne({ '_id': id });
        if (result.deletedCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Usuario no encontrado para eliminar.' });
        }
        res.json({ status: 'success', payload: result});
    } catch(error) {
        console.error("Error al eliminar usuario:", error);
        res.status(500).send("Error en el servidor");
    }
});

export default router;