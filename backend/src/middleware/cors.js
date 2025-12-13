import cors from 'cors';

const DEV = process.env.NODE_ENV !== 'production';


const FRONTENDS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5073',
  'http://127.0.0.1:5073',
  'http://localhost:3000',
  'http://tecnicojoel01.unaux.com',   
  'https://tecnicojoel01.unaux.com', 
  'https://tiendatecnicojoel.onrender.com/',
  'https://tecnicojoel-tienda.onrender.com',
  'https://tecnicojoel-tienda-1.onrender.com',
  'https://www.tecnicojoel-tienda1-onrender.com'
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
        
        if (!origin) return cb(null, true);
        
        if (FRONTENDS.includes(origin)) {
          return cb(null, true);
        } else {
         
          console.log('Bloqueado por CORS el origen:', origin);
          return cb(new Error('Origin not allowed: ' + origin), false);
        }
      },
      credentials: true,
      methods: ['GET','POST','PUT','DELETE','OPTIONS'],
      allowedHeaders: ['Content-Type','Authorization']
    };

export default cors(corsOptions);