# Recuperação de senha por código

Na tela de login, selecione **Esqueci minha senha**, informe o e-mail e depois o código recebido e a nova senha (8 a 128 caracteres). O formulário aceita códigos de 6 a 10 dígitos e permite solicitar outro código.

## Configuração antes de usar

No Supabase, em Authentication → Email Templates → Reset Password, configure o corpo do e-mail para mostrar `{{ .Token }}`. Exemplo:

```html
<h2>Recuperação de senha — Anjos de Patas</h2>
<p>Seu código é: <strong>{{ .Token }}</strong></p>
<p>Volte à página de recuperação e informe o código para definir sua nova senha.</p>
<p>Se você não solicitou a alteração, ignore esta mensagem.</p>
```

Configure entrega de e-mail/SMTP, validade e limites do Auth. O modelo padrão baseado em link não atende a este formulário por código. Não é necessária migração SQL. O servidor utiliza SUPABASE_URL e SUPABASE_KEY; nenhuma chave é enviada ao navegador.

As rotas POST /api/recuperar-senha e POST /api/redefinir-senha usam o limite de tentativas de login. A solicitação responde genericamente para contas inexistentes. O código precisa ser validado pelo Auth antes da alteração. A sessão de recuperação permanece no servidor e não é devolvida ao navegador.

Após o sucesso, a aplicação solicita encerramento global das sessões e limpa os tokens locais. Tokens de acesso emitidos anteriormente podem continuar válidos até expirar.

## Validação manual

Com uma conta de teste, conferir entrega real do e-mail, código inválido/expirado, senhas divergentes, solicitação de novo código, alteração bem-sucedida e login com a nova senha. Os testes automatizados usam Auth simulado e não confirmam a configuração remota.

Referências: [resetPasswordForEmail](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail), [verifyOtp](https://supabase.com/docs/reference/javascript/auth-verifyotp).
