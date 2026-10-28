export function imagemPublica(valor) {
    if(typeof valor!=='string')return undefined;
    try {const url=new URL(valor);return ['http:','https:'].includes(url.protocol)?url.href:undefined;}catch{return undefined;}
}

// Miniaturas já existentes no Storage deste lote. Outras fotos usam o original.
export function miniaturaPublica(valor) {
    const original=imagemPublica(valor);if(!original)return undefined;
    const url=new URL(original);
    if(url.hostname==='nadggghbymqvvueiihab.supabase.co'&&/^\/storage\/v1\/object\/public\/animais-imagens\/testes-assistente\/20261028\/\d+-[a-z-]+\.png$/.test(url.pathname)){
        url.pathname=url.pathname.replace(/\/([^/]+)\.png$/,'/miniaturas/$1.jpg');return url.href;
    }
    return original;
}
