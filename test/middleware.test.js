import test from "node:test";
import assert from "node:assert/strict";

import {
    exigirPermissao
} from "../src/middlewares/authMiddleware.js";

import {
    errorHandler
} from "../src/middlewares/errorHandler.js";

function respostaFalsa() {
    return {
        statusCode: null,
        body: null,

        status(codigo) {
            this.statusCode = codigo;
            return this;
        },

        json(valor) {
            this.body = valor;
            return this;
        }
    };
}

test(
    "exigirPermissao permite perfil autorizado",
    () => {
        const req = {
            perfil: {
                perfil: "voluntario",
                ativo: true
            }
        };

        const res =
            respostaFalsa();

        let chamado = false;

        exigirPermissao(
            "admin",
            "voluntario"
        )(
            req,
            res,
            () => {
                chamado = true;
            }
        );

        assert.equal(
            chamado,
            true
        );

        assert.equal(
            res.statusCode,
            null
        );
    }
);

test(
    "exigirPermissao bloqueia perfil sem acesso",
    () => {
        const req = {
            perfil: {
                perfil: "veterinario",
                ativo: true
            }
        };

        const res =
            respostaFalsa();

        let chamado = false;

        exigirPermissao(
            "admin"
        )(
            req,
            res,
            () => {
                chamado = true;
            }
        );

        assert.equal(
            chamado,
            false
        );

        assert.equal(
            res.statusCode,
            403
        );

        assert.deepEqual(
            res.body,
            {
                erro:
                    "Usuário sem permissão para esta operação."
            }
        );
    }
);

test(
    "errorHandler oculta detalhes de erros internos",
    () => {
        const req = {
            method: "GET",
            originalUrl: "/health"
        };

        const res =
            respostaFalsa();

        errorHandler(
            new Error(
                "segredo do banco"
            ),
            req,
            res,
            () => {}
        );

        assert.equal(
            res.statusCode,
            500
        );

        assert.equal(
            res.body.erro,
            "Erro interno do servidor."
        );
    }
);