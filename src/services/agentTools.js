import { supabase } from '../config/database.js';
import {
    buscarAnimaisArgsSchema,
    detalhesAnimalArgsSchema
} from '../schemas/agentSchemas.js';

export const agentToolDefinitions = [
    {
        name: 'buscar_animais',
        description:
            'Busca animais disponíveis para adoção usando características informadas pelo usuário.',
        parameters: {
            type: 'OBJECT',
            properties: {
                nome: {
                    type: 'STRING',
                    description: 'Parte do nome do animal.'
                },
                especie: {
                    type: 'STRING',
                    enum: ['cao', 'gato']
                },
                sexo: {
                    type: 'STRING',
                    enum: ['macho', 'femea']
                },
                porte: {
                    type: 'STRING',
                    enum: ['pequeno', 'medio', 'grande']
                },
                faixa_etaria: {
                    type: 'STRING',
                    enum: ['filhote', 'adulto', 'idoso']
                },
                convivencia_criancas: {
                    type: 'BOOLEAN'
                },
                convivencia_outros_animais: {
                    type: 'BOOLEAN'
                }
            }
        }
    },
    {
        name: 'obter_detalhes_animal',
        description:
            'Consulta os detalhes públicos de um animal disponível para adoção.',
        parameters: {
            type: 'OBJECT',
            properties: {
                animal_id: {
                    type: 'STRING',
                    description: 'Identificador do animal.'
                }
            },
            required: ['animal_id']
        }
    },
    {
        name: 'consultar_requisitos_adocao',
        description:
            'Explica de forma geral como funciona o processo de adoção da ONG.',
        parameters: {
            type: 'OBJECT',
            properties: {}
        }
    },
    {
        name: 'encaminhar_para_voluntario',
        description:
            'Indica que o atendimento precisa ser continuado por um voluntário da ONG. Esta ferramenta não realiza contato nem registra encaminhamento.',
        parameters: {
            type: 'OBJECT',
            properties: {
                motivo: {
                    type: 'STRING',
                    description: 'Motivo pelo qual o atendimento humano é necessário.'
                }
            },
            required: ['motivo']
        }
    }
];

async function buscarAnimais(argumentos, cliente) {
    const validacao =
        buscarAnimaisArgsSchema.safeParse(argumentos);

    if (!validacao.success) {
        return {
            sucesso: false,
            erro: 'Critérios de busca inválidos.'
        };
    }

    const filtros = validacao.data;

    let consulta = cliente
        .from('animais')
        .select(
            'id, nome, especie, sexo, porte, faixa_etaria, temperamento, convivencia_criancas, convivencia_outros_animais, situacao'
        )
        .eq('situacao', 'disponivel')
        .limit(20);

    if (filtros.nome) {
        consulta = consulta.ilike(
            'nome',
            `%${filtros.nome}%`
        );
    }

    if (filtros.especie) {
        consulta = consulta.eq(
            'especie',
            filtros.especie
        );
    }

    if (filtros.sexo) {
        consulta = consulta.eq(
            'sexo',
            filtros.sexo
        );
    }

    if (filtros.porte) {
        consulta = consulta.eq(
            'porte',
            filtros.porte
        );
    }

    if (filtros.faixa_etaria) {
        consulta = consulta.eq(
            'faixa_etaria',
            filtros.faixa_etaria
        );
    }

    if (filtros.convivencia_criancas !== undefined) {
        consulta = consulta.eq(
            'convivencia_criancas',
            filtros.convivencia_criancas
        );
    }

    if (
        filtros.convivencia_outros_animais !==
        undefined
    ) {
        consulta = consulta.eq(
            'convivencia_outros_animais',
            filtros.convivencia_outros_animais
        );
    }

    const { data, error } = await consulta;

    if (error) {
        throw error;
    }

    return {
        sucesso: true,
        total: data?.length || 0,
        animais: data || []
    };
}

async function obterDetalhesAnimal(
    argumentos,
    cliente
) {
    const validacao =
        detalhesAnimalArgsSchema.safeParse(argumentos);

    if (!validacao.success) {
        return {
            sucesso: false,
            erro: 'Identificador de animal inválido.'
        };
    }

    const { data, error } = await cliente
        .from('animais')
        .select(
            'id, nome, especie, sexo, porte, faixa_etaria, temperamento, convivencia_criancas, convivencia_outros_animais, situacao'
        )
        .eq('id', validacao.data.animal_id)
        .eq('situacao', 'disponivel')
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (!data) {
        return {
            sucesso: false,
            erro: 'Animal disponível não encontrado.'
        };
    }

    return {
        sucesso: true,
        animal: data
    };
}

export async function executarFerramenta(
    nome,
    argumentos = {},
    cliente = supabase
) {
    if (nome === 'buscar_animais') {
        return buscarAnimais(argumentos, cliente);
    }

    if (nome === 'obter_detalhes_animal') {
        return obterDetalhesAnimal(
            argumentos,
            cliente
        );
    }

    if (nome === 'consultar_requisitos_adocao') {
        return {
            sucesso: true,
            requisitos: [
                'A pessoa interessada deve preencher seus dados de contato.',
                'A ONG realiza uma triagem antes de concluir a adoção.',
                'A confirmação final depende de um voluntário da ONG.'
            ]
        };
    }

    if (nome === 'encaminhar_para_voluntario') {
        return {
            sucesso: true,
            requer_atendimento_humano: true,
            encaminhamento_realizado: false,
            mensagem:
                'Este atendimento precisa ser continuado por um voluntário da ONG. Nenhum contato ou encaminhamento foi realizado automaticamente.'
        };
    }

    return {
        sucesso: false,
        erro: 'Ferramenta não autorizada.'
    };
}