// Executa a API Express como função da Netlify. As páginas são servidas pela CDN
// (pasta dist) e o netlify.toml redireciona /api/* e /health para esta função.
import serverless from 'serverless-http';
import app from '../../src/app.js';

// Na função não há conexão direta com o navegador; a Netlify informa o IP real
// no cabeçalho x-nf-client-connection-ip. O limite de tentativas usa req.ip.
function ipDoCliente(event) {
    const h = event.headers || {};
    return h['x-nf-client-connection-ip']
        || h['x-forwarded-for']?.split(',')[0].trim()
        || event.requestContext?.identity?.sourceIp
        || '0.0.0.0';
}

export const handler = serverless(app, {
    basePath: '/.netlify/functions/api',
    binary: ['image/jpeg', 'image/png', 'image/webp'],
    request(req, event) {
        Object.defineProperty(req, 'ip', { value: ipDoCliente(event), configurable: true });
    }
});
