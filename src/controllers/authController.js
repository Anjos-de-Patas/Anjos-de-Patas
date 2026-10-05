import {
    supabase
} from "../config/database.js";

export async function login(req, res) {
    try {
        const {
            email,
            password
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                sucesso: false,
                erro: "Email e senha são obrigatórios."
            });
        }

        const {
            data,
            error
        } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            throw error;
        }

        const usuarioAuth =
            data.user;

        const sessao =
            data.session;

        if (
            !usuarioAuth ||
            !sessao?.access_token
        ) {
            return res.status(401).json({
                sucesso: false,
                erro: "Não foi possível criar uma sessão válida."
            });
        }

        const {
            data: perfil,
            error: erroPerfil
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
            erroPerfil ||
            !perfil
        ) {
            return res.status(403).json({
                sucesso: false,
                erro: "Usuário sem perfil cadastrado no sistema."
            });
        }

        if (!perfil.ativo) {
            return res.status(403).json({
                sucesso: false,
                erro: "Este usuário está desativado."
            });
        }

        res.status(200).json({
            sucesso: true,

            token:
                sessao.access_token,

            usuario: {
                id:
                    usuarioAuth.id,

                nome:
                    perfil.nome,

                email:
                    usuarioAuth.email,

                perfil:
                    perfil.perfil
            }
        });

    } catch (error) {
        res.status(401).json({
            sucesso: false,
            erro: "Credenciais inválidas. Verifique o email e a senha."
        });
    }
}