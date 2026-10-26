const animalId = new URLSearchParams(window.location.search).get('id');
const estadoAnimal = document.querySelector('#estado-animal');
const perfilAnimal = document.querySelector('#perfil-animal');
const recarregar = document.querySelector('#recarregar-animal');
const formInteresse = document.querySelector('#form-interesse');
const estadoInteresse = document.querySelector('#estado-interesse');
const enviarInteresse = document.querySelector('#enviar-interesse');
let animalAtual = null;
const rotulos = { cao: 'Cachorro', gato: 'Gato', femea: 'Fêmea', macho: 'Macho', pequeno: 'Pequeno', medio: 'Médio', grande: 'Grande', filhote: 'Filhote', adulto: 'Adulto', idoso: 'Idoso' };
const convivencia = (valor) => typeof valor === 'boolean' ? (valor ? 'Sim' : 'Não') : 'Consulte a equipe';

async function carregarAnimal() {
    animalAtual = null;
    perfilAnimal.hidden = true;
    estadoAnimal.hidden = false;
    estadoAnimal.textContent = 'Carregando perfil do animal...';
    recarregar.hidden = true;
    if (!animalId || !(/^(\d{1,20}|[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12})$/i.test(animalId))) {
        estadoAnimal.textContent = 'Selecione um animal no catálogo para consultar seu perfil.';
        return;
    }
    try {
        const { animal } = await window.AnjosAPI.solicitar(`/api/animais/${encodeURIComponent(animalId)}`);
        if (!animal || animal.situacao !== 'disponivel') throw new Error('Este animal não está disponível para adoção.');
        animalAtual = animal;
        document.title = `${animal.nome} | Adoção | Anjos de Patas`;
        document.querySelector('#nome-animal').textContent = animal.nome;
        document.querySelector('#animal-interesse').textContent = animal.nome;
        document.querySelector('#temperamento-animal').textContent = animal.temperamento || 'Converse com a equipe para conhecer o temperamento e as necessidades deste animal.';
        const foto = document.querySelector('#foto-animal');
        const placeholder = document.querySelector('#foto-ausente');
        foto.hidden = true;
        placeholder.hidden = false;
        if (/^https?:\/\//i.test(animal.imagem_url || '')) {
            foto.alt = `Foto de ${animal.nome}`;
            foto.onerror = () => { foto.hidden = true; placeholder.hidden = false; };
            foto.src = animal.imagem_url;
            foto.hidden = false;
            placeholder.hidden = true;
        }
        const ficha = document.querySelector('#ficha-animal');
        ficha.replaceChildren();
        for (const [titulo, valor] of [
            ['Espécie', rotulos[animal.especie]], ['Sexo', rotulos[animal.sexo]],
            ['Porte', rotulos[animal.porte]], ['Faixa etária', rotulos[animal.faixa_etaria]],
            ['Convive com crianças', convivencia(animal.convivencia_criancas)],
            ['Convive com outros animais', convivencia(animal.convivencia_outros_animais)]
        ]) {
            const div = document.createElement('div');
            const dt = document.createElement('dt');
            const dd = document.createElement('dd');
            dt.textContent = titulo;
            dd.textContent = valor || 'Não informado';
            div.append(dt, dd);
            ficha.append(div);
        }
        estadoAnimal.hidden = true;
        perfilAnimal.hidden = false;
        if (window.location.hash === '#interesse') document.querySelector('#interesse').scrollIntoView();
    } catch (erro) {
        estadoAnimal.textContent = erro.message;
        recarregar.hidden = false;
    }
}

formInteresse.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (enviarInteresse.disabled || !animalAtual || !formInteresse.reportValidity()) return;
    estadoInteresse.hidden = false;
    estadoInteresse.classList.remove('erro');
    const dados = Object.fromEntries(new FormData(formInteresse));
    dados.cidade = `${dados.cidade.trim()}, ${dados.estado}`;
    delete dados.estado;
    dados.telefone = dados.telefone.replace(/\D/g, '');
    if (!/^\d{10,11}$/.test(dados.telefone)) {
        estadoInteresse.textContent = 'Informe telefone e DDD com 10 ou 11 números.';
        estadoInteresse.classList.add('erro');
        document.querySelector('#telefone').focus();
        return;
    }
    dados.animal_id = String(animalAtual.id);
    dados.consentimento = document.querySelector('#consentimento').checked;
    enviarInteresse.disabled = true;
    enviarInteresse.textContent = 'Enviando...';
    estadoInteresse.textContent = 'Registrando sua manifestação de interesse...';
    try {
        await window.AnjosAPI.solicitar('/api/interesses', { method: 'POST', body: JSON.stringify(dados) });
        formInteresse.reset();
        formInteresse.hidden = true;
        estadoInteresse.hidden = true;
        const sucesso = document.querySelector('#sucesso-interesse');
        sucesso.hidden = false;
        sucesso.focus();
    } catch (erro) {
        estadoInteresse.textContent = erro.message;
        estadoInteresse.classList.add('erro');
    } finally {
        enviarInteresse.disabled = false;
        enviarInteresse.textContent = 'Enviar manifestação de interesse';
    }
});
recarregar.addEventListener('click', carregarAnimal);
carregarAnimal();
