const quantidades=['','uma opção','duas opções','três opções'];
const idades={filhote:'filhotes',adulto:'adultos',idoso:'idosos'};
function descricao(filtros){
    const especie=filtros.especie==='cao'?'cães':filtros.especie==='gato'?'gatos':'animais';
    return [especie,idades[filtros.faixa_etaria],filtros.porte?`de porte ${filtros.porte}`:''].filter(Boolean).join(' ');
}
export function respostaConsulta(nome,resultado,filtros,mensagem){
    if(!resultado?.sucesso)return null;
    if(nome==='buscar_animais'){
        const n=Math.min(3,resultado.animais?.length||0);
        if(n)return n===1?'Encontrei uma opção com as características que você me contou. Dá uma olhada na foto e no perfil. Quer conhecer melhor esse companheiro?':`Separei ${quantidades[n]} com as características que você procura. Dá uma olhada nas fotos abaixo. Qual delas você gostaria de conhecer melhor?`;
        const base=`Não encontrei ${descricao(filtros)} no cadastro agora.`;
        if(filtros.porte)return `${base} Quer que eu procure outro porte, mantendo as demais preferências?`;
        if(filtros.faixa_etaria)return `${base} Você gostaria que eu verificasse ${filtros.faixa_etaria==='adulto'?'filhotes':'adultos'}, mantendo a espécie?`;
        return `${base} Você prefere conhecer os cães ou os gatos disponíveis?`;
    }
    if(nome==='obter_detalhes_animal'&&resultado.animal){
        const a=resultado.animal;
        if(/adotar|interesse|quero ficar/i.test(mensagem))return `Que bom que você se interessou por ${a.nome}! Abra o perfil e toque em “Manifestar interesse” para enviar seu interesse à equipe. O envio inicia a triagem, sem reservar o animal ou confirmar a adoção.`;
        if(/vacina|castra|saude|saúde|remedio|remédio/i.test(mensagem))return `Essa informação de saúde não está disponível na consulta pública de ${a.nome}. A equipe poderá confirmar os cuidados necessários antes da adoção.`;
        if(/crian[cç]a/i.test(mensagem)&&typeof a.convivencia_criancas==='boolean')return `O cadastro de ${a.nome} indica que ${a.convivencia_criancas?'convive bem':'não convive'} com crianças. Vale conversar com a equipe para avaliar a rotina da sua casa. Você gostaria de abrir o perfil?`;
        const feminino=a.sexo==='femea';
        const especie=a.especie==='cao'?(feminino?'cadela':'cão'):(feminino?'gata':'gato');
        const idade=a.faixa_etaria==='filhote'?'filhote':a.faixa_etaria==='idoso'?(feminino?'idosa':'idoso'):(feminino?'adulta':'adulto');
        const temperamento=(a.temperamento||'').replace(/^\[DADOS FICTÍCIOS[^\]]*\]\s*/,'').split(/[.!]/)[0].trim();
        return `${a.nome} é ${feminino?'uma':'um'} ${especie} ${idade}${a.porte?` de porte ${a.porte}`:''}.${temperamento?` Pelo cadastro, ${feminino?'ela':'ele'} é ${temperamento.charAt(0).toLowerCase()+temperamento.slice(1)}.`:''} Quer conhecer o processo para manifestar interesse?`;
    }
    return null;
}
