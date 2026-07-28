# 🏥 Sistema de Controle de Plantões Médicos — Jaborandi/SP

Sistema web completo para gestão de escalas médicas, transferências e visitas
hospitalares, com login por perfil, dashboards e relatórios de fechamento
para pagamento — baseado na planilha **CONTAGEM DE PLANTÕES MÉDICOS 1.1**.

Funciona 100% online: você acessa pelo celular, de casa, do trabalho, de
qualquer lugar, por um link — igual ao pegaplantão.com.br — e pode publicá-lo
gratuitamente no **GitHub Pages**, do mesmo jeito que você já fez com o seu
projeto `joaoalbertobuenovilchi.github.io/controle-exames`.

## ⚠️ Leia isto primeiro — como o "banco de dados" funciona

O GitHub Pages **hospeda apenas arquivos** (HTML/CSS/JS) — ele não tem banco
de dados nem login próprios. Por isso este sistema usa o **Firebase**
(ferramenta do Google, com plano gratuito bem generoso: até 50 mil leituras
e 20 mil escritas por dia) como banco de dados e login **online**, acessível
de qualquer lugar. O GitHub Pages continua sendo o "endereço" (o link) que
você acessa; o Firebase é o "arquivo" onde os dados ficam guardados com
segurança. Essa é a forma correta e realista de ter login + dados
compartilhados em tempo real dentro de um site 100% estático como o GitHub
Pages — não existe outra forma gratuita e confiável de fazer isso sem um
servidor próprio.

Tudo abaixo é gratuito e leva cerca de 15 minutos para configurar.

---

## 📁 O que está neste pacote

```
sistema-plantoes/
├── index.html                    → página principal do sistema
├── assets/
│   ├── firebase-config.js        → você cola aqui as chaves do SEU Firebase
│   ├── app.js                    → toda a lógica do sistema
│   └── style.css                 → visual do sistema
├── firestore.rules               → regras de segurança (quem pode ver/editar o quê)
├── seed-profissionais.json       → os 58 profissionais já extraídos da sua planilha
└── README.md                     → este guia
```

---

## 🚀 Passo a passo de publicação

### 1. Crie o projeto Firebase (gratuito)
1. Acesse **console.firebase.google.com** e clique em **Adicionar projeto**.
2. Dê um nome (ex.: `plantoes-jaborandi`) e finalize a criação.
3. No menu lateral, vá em **Compilação → Authentication → Vamos começar**
   e ative o provedor **E-mail/senha**.
4. Vá em **Compilação → Firestore Database → Criar banco de dados**.
   Escolha a região mais próxima (ex.: `southamerica-east1`) e o modo
   **produção**.
5. Em **Firestore Database → Regras**, apague o conteúdo e cole o conteúdo
   do arquivo `firestore.rules` deste pacote. Clique em **Publicar**.
6. Volte em **Configurações do projeto** (ícone de engrenagem) → aba
   **Geral** → role até "Seus apps" → clique no ícone **</>** (Web) →
   registre um app (qualquer nome) → copie o objeto `firebaseConfig` que
   aparece.

### 2. Cole suas chaves no sistema
Abra `assets/firebase-config.js` e substitua os valores de exemplo pelos
que você copiou no passo anterior. Salve o arquivo.

### 3. Publique no GitHub Pages
1. Crie um repositório novo no GitHub (ex.: `controle-plantoes`).
2. Envie todos os arquivos deste pacote para o repositório (pela interface
   web do GitHub em "Add file → Upload files", ou por `git push`).
3. Vá em **Settings → Pages** do repositório → em "Branch" selecione
   `main` e pasta `/root` → **Save**.
4. Em 1–2 minutos seu sistema estará no ar em:
   `https://SEUUSUARIO.github.io/controle-plantoes/`

### 4. Crie o primeiro usuário Administrador
1. Acesse o link do seu sistema e clique em **"Ainda não tenho acesso —
   criar conta"**. Cadastre-se com seu e-mail e senha.
2. Sua conta ficará com o status **"Aguardando aprovação"** (isso é
   proposital — é o que garante que só quem você autorizar acessa).
3. No **console do Firebase → Firestore Database → dados**, abra a coleção
   `usuarios`, encontre o documento com o seu e-mail e edite manualmente
   dois campos: `perfil` → `administrador` e `ativo` → `true`.
4. Volte ao sistema e atualize a página (F5). Você já entra como
   Administrador — e a partir daí todos os próximos usuários podem ser
   aprovados direto pela tela **"Usuários e Perfis"**, sem precisar mexer
   no Firebase de novo.

### 5. Importe os profissionais da planilha
Dentro do sistema, com login de Administrador, vá em **Profissionais** e
clique em **"Importar lista da planilha"** — os 58 profissionais já
extraídos do seu arquivo `.xlsm` serão cadastrados automaticamente.

---

## 👤 Perfis de acesso

| Perfil | O que pode fazer |
|---|---|
| **Administrador** | Acesso total: escalas, profissionais, relatórios, usuários e configurações de valores |
| **Coordenador de Escalas** | Edita escalas e cadastro de profissionais, vê relatórios e dashboards (não gerencia usuários/valores) |
| **Médico(a)** | Visualiza escalas, profissionais, relatórios e dashboards (não edita) |
| **Enfermeiro(a)** | Mesmo acesso do médico: visualização de escalas, relatórios e dashboards |
| **Técnico(a) de Enfermagem** | Visualiza apenas as escalas e o painel geral |

Você pode renomear ou ajustar esses perfis diretamente no início do arquivo
`assets/app.js`, no objeto `PERFIS` e na lista `NAV` (defina em `perfis: []`
quem enxerga cada tela).

---

## 🧮 Como o sistema calcula os valores (baseado na sua planilha original)

A planilha usa uma tabela de conversão de código → horas, e depois converte
horas em "unidades de 12h" para aplicar o valor do plantão. Os valores
padrão (idênticos aos da sua planilha) são:

- Código **N, D, T** = 12h · **M** = 6h · **6** = 6h · **18** = 18h · **24** = 24h · **F** (férias) e **V** (visita) não contam horas de plantão.
- Plantão de 12h = **R$ 950,00** · Transferência (unidade 12h) = **R$ 330,00** · Visita médica = **R$ 233,33/dia**.

Todos esses valores podem ser ajustados a qualquer momento em
**Configurações** (perfil Administrador), sem precisar mexer no código.

> **Importante:** o cálculo de Transferências e Visitas na planilha
> original tinha algumas regras específicas (valor mensal fixo por
> visitador, bônus do responsável pela escala etc.) que dependem de
> decisões administrativas da Secretaria. O sistema já traz a lógica
> principal (a mesma que reproduz corretamente os valores da aba
> "FECHAMENTO COMPLETO" da sua planilha), mas revise os primeiros
> relatórios comparando com a planilha antes de usar oficialmente para
> pagamento.

---

## 📊 O que o sistema já entrega

- **Login por e-mail/senha**, com aprovação de acesso por perfil.
- **3 escalas mensais** (Plantões, Transferências, Visitas) em grade de
  calendário, iguais à sua planilha, com código colorido e clique para
  alternar (N/D/T/M/24/18/6/F ou V), cálculo automático do total de horas
  por profissional em tempo real.
- **Cadastro de profissionais** (nome, CRM, CPF, dados bancários, PIX,
  emissão de nota fiscal).
- **Painel/Dashboard** com indicadores do mês, gráfico de horas por
  profissional, distribuição por tipo de plantão e evolução dos últimos
  6 meses.
- **Relatório de Fechamento** por profissional (equivalente às abas
  "FECHAMENTO" da planilha), com botão de impressão/PDF.
- **Gestão de usuários e perfis** pela própria interface.
- **Configurações** de valores de pagamento e conversão de horas.

## 🔧 Para evoluir depois
Ideias fáceis de acrescentar no mesmo padrão de código: exportar relatório
em Excel, histórico de alterações da escala, solicitação de troca de
plantão entre profissionais, notificações por e-mail, campo de observações
por dia, e vincular este sistema ao seu projeto existente
`controle-exames` como um segundo módulo do mesmo painel.
