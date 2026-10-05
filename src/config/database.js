import {
    createClient
} from "@supabase/supabase-js";

import dotenv from "dotenv";

dotenv.config();

if (
    !process.env.SUPABASE_URL ||
    !process.env.SUPABASE_KEY ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
) {
    throw new Error(
        "As variáveis do Supabase precisam estar configuradas."
    );
}

const configuracaoAuth = {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
    }
};

export const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY,
    configuracaoAuth
);

export const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    configuracaoAuth
);