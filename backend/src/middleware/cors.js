import cors from 'cors';

const DEV = process.env.NODE_ENV !== 'production';

const FRONTENDS = [
  // --- Entorno Local ---
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5073',
  'http://127.0.0.1:5073',
  'http://localhost:3000',
  'http://localhost:4000', // A veces útil para pruebas locales del backend

  // --- Hosting Antiguo (Unaux) ---
  'http://tecnicojoel01.unaux.com', 
  'https://tecnicojoel01.unaux.com', 

  // --- Backend en Render (Autoreferencia) ---
  'https://tecnicojoel-tienda.onrender.com',
  'https://tecnicojoel-tienda-1.onrender.com',
  
  // --- NUEVO: VERCEL (Tu Frontend Oficial) ---
  'https://tiendatecnicojoel.vercel.app',
  // Agregamos también la versión con 'www' por si acaso
  'https://www.tiendatecnicojoel.vercel.app' 
];

const corsOptions = DEV
  ? {
      origin: true,
      credentials: true,
      methods: ['GET','POST','PUT','DELETE','OPTIONS'],
      allowedHeaders: ['Content-Type','Authorization']
    }
  : {
      origin: (origin, cb) => {
        // Permitir peticiones sin origen (como Postman o Server-to-Server)
        if (!origin) return cb(null, true);
        
        // Verificamos si el origen está en la lista EXACTA
        if (FRONTENDS.includes(origin)) {
          return cb(null, true);
        } 
        // TRUCO EXTRA: Permitir cualquier subdominio de Vercel (para que te funcionen las URLs largas de prueba también)
        else if (origin.endsWith('.vercel.app')) {
           return cb(null, true);
        }
        else {
          console.log('Bloqueado por CORS el origen:', origin);
          return cb(new Error('Origin not allowed: ' + origin), false);
        }
      },
      credentials: true,
      methods: ['GET','POST','PUT','DELETE','OPTIONS'],
      allowedHeaders: ['Content-Type','Authorization']
    };

export default cors(corsOptions);