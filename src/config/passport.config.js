
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JWTStrategy, ExtractJwt } from "passport-jwt";
import userModel from '../models/user.model.js';
import { createHash, isValidPassword } from '../../utils.js';
import config from './index.js'; 

const PRIVATE_KEY = config.JWT_SECRET; 



const registerLocalStrategy = new LocalStrategy(
    { passReqToCallback: true, usernameField: "email" },
    async (req, email, password, done) => {
        const { first_name, last_name, age } = req.body;

        try {
            if (!first_name || !last_name || !age || !email || !password) {
                console.log("Campos incompletos para el registro.");
                return done(null, false, { message: "Faltan campos obligatorios para el registro." });
            }

            let userFound = await userModel.findOne({ email });
            if (userFound) {
                console.log("Usuario ya existe.");
                return done(null, false, { message: "El email ya está registrado." });
            }

            const newUser = {
                first_name,
                last_name,
                email,
                age,
                password: createHash(password),
                role: email === 'adminCoder@coder.com' ? 'admin' : 'user'
            };

            const user = await userModel.create(newUser);
            return done(null, user);

        } catch (error) {
            console.error("Error en estrategia de registro:", error.message);
            return done(error);
        }
    }
);

const loginLocalStrategy = new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
        try {
            const user = await userModel.findOne({ email });
            if (!user) {
                console.log("Usuario no encontrado para login.");
                return done(null, false, { message: "Credenciales inválidas." });
            }

            if (!isValidPassword(password, user.password)) {
                console.log("Contraseña incorrecta.");
                return done(null, false, { message: "Credenciales inválidas." });
            }

            return done(null, user);
        } catch (error) {
            console.error("Error en estrategia de login:", error.message);
            return done(error);
        }
    }
);

const cookieExtractor = req => {
    let token = null;
    if (req && req.cookies) {
        token = req.cookies['jwtCookie'];
        //console.log("PASSPORT_CONFIG: req.cookies en cookieExtractor:", req.cookies); 
        console.log("PASSPORT_CONFIG: Token extraído por cookieExtractor:", token); 
    }
    return token;
};

const jwtStrategy = new JWTStrategy(
    {
        jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
        secretOrKey: PRIVATE_KEY
    },
    async (jwt_payload, done) => {
        console.log("PASSPORT_CONFIG: Payload JWT recibido:", jwt_payload); 
        try {
            const user = await userModel.findById(jwt_payload.user._id).lean();

            if (!user) {
                console.log("PASSPORT_CONFIG: Usuario no encontrado en DB para el token.");
                return done(null, false, { message: "Usuario no encontrado en la base de datos (JWT válido, pero usuario inexistente)." });
            }
            delete user.password;
            //console.log("PASSPORT_CONFIG: Usuario validado por JWT:", user); 
            return done(null, user);
        } catch (error) {
            //console.error("PASSPORT_CONFIG: Error en estrategia JWT (verificación o DB):", error.message);
            return done(error);
        }
    }
);

const initializedPassport = () => {
    passport.use("register", registerLocalStrategy);
    passport.use("login", loginLocalStrategy);
    passport.use("jwt", jwtStrategy);
};

export default initializedPassport;