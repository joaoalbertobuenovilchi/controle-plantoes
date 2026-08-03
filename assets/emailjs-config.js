// ==========================================================================
// CONFIGURAÇÃO DE E-MAIL (EmailJS) — usado só para as Trocas de Plantão
// ==========================================================================
// O sistema funciona 100% sem isto: as solicitações de troca sempre aparecem
// dentro do próprio sistema, na tela "Trocas de Plantão", para quem precisa
// confirmar ou autorizar. Configurar o EmailJS é OPCIONAL — serve apenas para
// que a pessoa também receba um e-mail avisando (com os botões SIM/NÃO
// clicáveis direto no e-mail, no caso do convite de troca).
//
// Como configurar (gratuito, ~5 minutos, mesmo espírito do cadastro do Firebase):
// 1. Crie uma conta grátis em https://www.emailjs.com
// 2. Em "Email Services", conecte seu Gmail/Outlook (ou outro) e copie o "Service ID".
// 3. Em "Email Templates", crie um template novo:
//      Para (To Email): {{to_email}}
//      Assunto (Subject): {{subject}}
//      Corpo (Content): cole {{{corpo_html}}} (com 3 chaves de cada lado — é o que
//        faz o EmailJS exibir o conteúdo como HTML de verdade, com os botões SIM/NÃO
//        clicáveis, em vez de mostrar o código HTML como texto puro).
//      Copie o "Template ID".
// 4. Em "Account" > "General", copie sua "Public Key".
// 5. Cole os 3 valores abaixo.
// ==========================================================================

const EMAILJS_CONFIG = {
  publicKey: "",     // ex.: "AbCdEfGhIjKlMnOp"
  serviceId: "",      // ex.: "service_xxxxxxx"
  templateId: "",     // ex.: "template_xxxxxxx"
};

if (EMAILJS_CONFIG.publicKey && window.emailjs) {
  emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });
}
