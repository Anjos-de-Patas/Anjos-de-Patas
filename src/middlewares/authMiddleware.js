import {
    createClient
} from "@supabase/supabase-js";

import {
    supabase
} from "../config/database.js";

export const verificarToken =
    async (req, res, next) => {

        const authHeader =
            req.headers.authorization;

        if (
            !authHeader ||
            !/^Bearer\s+\S+$/i.test(
                authHeader
            )
        ) {
            return res.status(401).json({
                erro:
                    "Acesso negado. Use o formato Bearer <token>."
            });
        }

        const token =
            authHeader.replace(
                /^Bearer\s+/i,
                ""
            );

        const supabaseScoped =
            createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_KEY,
                {
                    global: {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    },

                    auth: {
                        persistSession: false,
                        autoRefreshToken: false
                    }
                }
            );

        const {
            data: {
                user
            },
            error
        } =
            await supabaseScoped.auth.getUser();

        if (
            error ||
            !user
        ) {
            return res.status(401).json({
                erro:
                    "Token inválido ou expirado."
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
                user.id
            )
            .single();

        if (
            erroPerfil ||
            !perfil
        ) {
            return res.status(403).json({
                erro:
                    "Usuário sem perfil cadastrado no sistema."
            });
        }

        if (!perfil.ativo) {
            return res.status(403).json({
                erro:
                    "Usuário desativado."
            });
        }

        req.supabase =
            supabaseScoped;

        req.user =
            user;

        req.perfil =
            perfil;

        next();
    };

export const exigirPermissao =
    (...perfisPermitidos) => {

        return (
            req,
            res,
            next
        ) => {

            const perfil =
                req.perfil?.perfil;

            if (
                perfisPermitidos.length > 0 &&
                !perfisPermitidos.includes(
                    perfil
                )
            ) {
                return res.status(403).json({
                    erro:
                        "Usuário sem permissão para esta operação."
                });
            }

            next();
        };
    };