import {
    supabase
} from "../config/database.js";

export async function obterPerfil(req, res) {
    try {
        const usuarioAuth =
            req.user;

        if (!usuarioAuth) {
            return res.status(401).json({
                sucesso: false,
                erro: "Usuário não autenticado."
            });
        }

        const {
            data: perfil,
            error
        } = await supabase
            .from("perfis")
            .select(
                "id, nome, perfil, ativo"
            )
            .eq(
                "id",
                usuarioAuth.id
            )
            .single();

        if (
            error ||
            !perfil
        ) {
            return res.status(404).json({
                sucesso: false,
                erro: "Perfil não encontrado."
            });
        }

        res.status(200).json({
            sucesso: true,

            usuario: {
                id:
                    perfil.id,

                nome:
                    perfil.nome,

                email:
                    usuarioAuth.email ||
                    "",

                perfil:
                    perfil.perfil
            }
        });

    } catch (error) {
        console.error(
            "Erro ao carregar perfil:",
            error
        );

        res.status(500).json({
            sucesso: false,
            erro: "Não foi possível carregar o perfil."
        });
    }
}

export async function atualizarPerfil(req, res) {
    try {
        const {
            nome
        } = req.body;

        if (
            typeof nome !== "string" ||
            nome.trim().length < 2 ||
            nome.trim().length > 100
        ) {
            return res.status(400).json({
                sucesso: false,
                erro: "Informe um nome válido."
            });
        }

        const nomeFormatado =
            nome.trim();

        const {
            data: perfilAtualizado,
            error
        } = await supabase
            .from("perfis")
            .update({
                nome:
                    nomeFormatado,

                atualizado_em:
                    new Date().toISOString()
            })
            .eq(
                "id",
                req.user.id
            )
            .select(
                "id, nome, perfil, ativo"
            )
            .single();

        if (error) {
            throw error;
        }

        if (!perfilAtualizado) {
            return res.status(404).json({
                sucesso: false,
                erro: "Perfil não encontrado."
            });
        }

        res.status(200).json({
            sucesso: true,

            mensagem:
                "Perfil atualizado com sucesso.",

            usuario: {
                id:
                    perfilAtualizado.id,

                nome:
                    perfilAtualizado.nome,

                email:
                    req.user.email ||
                    "",

                perfil:
                    perfilAtualizado.perfil
            }
        });

    } catch (error) {
        console.error(
            "Erro ao atualizar perfil:",
            error
        );

        res.status(500).json({
            sucesso: false,
            erro: "Não foi possível atualizar o perfil."
        });
    }
}