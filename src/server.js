import dotenv from 'dotenv';

dotenv.config();

const { default: app } = await import('./app.js');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor back-end ativo na porta ${PORT}`);
    console.log(
        `Frontend autorizado: ${
            process.env.FRONTEND_URL || 'http://localhost:5173'
        }`
    );
});