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

## ⚠️ Atualização importante (se você já tinha publicado uma versão anterior)

Esta versão trocou o modelo de permissões (perfis agora são criados e
configurados dentro do próprio sistema), adicionou o cadastro de
Entidades, o módulo de Trocas de Plantão (com confirmação por e-mail em
1 clique, sem precisar login), o catálogo de Relatórios, a Consulta de
Escalas em calendário e os Afastamentos/Faltas. Se seu Firebase já
estava configurado antes, você precisa **atualizar as regras do
Firestore de novo**: no console do Firebase → Firestore Database → aba
**Regras** → apague o conteúdo atual e cole o novo conteúdo do arquivo
`firestore.rules` deste pacote → **Publicar**. Sem isso, várias telas
novas não vão funcionar.

Além disso, como "Relatórios" e "Fechamento" agora são permissões
separadas (antes eram uma só), se você já tinha criado perfis
personalizados, vale abrir cada um em "Usuários e Perfis" e conferir se
o nível de acesso de "Relatórios" e "Fechamento" está como você quer —
perfis antigos podem ter ficado sem acesso a uma das duas telas novas
por padrão.

## ✉️ E-mail das Trocas de Plantão (opcional)

As trocas de plantão **funcionam mesmo sem configurar e-mail** — tudo
aparece dentro do próprio sistema, na tela "Trocas de Plantão", para
quem precisa confirmar ou autorizar. Se você também quiser que as
pessoas recebam um e-mail avisando, abra o arquivo
`assets/emailjs-config.js` — ele tem o passo a passo completo (uns 5
minutos, gratuito, no mesmo espírito do cadastro do Firebase que você já
fez).

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

- **Perfis de acesso 100% configuráveis** — em "Usuários e Perfis", clique em
  **"🗂️ Novo Perfil"** para criar quantos perfis quiser (ex.: Recepção,
  Farmácia, Financeiro), além dos 5 que já vêm prontos (Administrador,
  Coordenador de Escalas, Médico, Enfermeiro, Técnico de Enfermagem). Para
  cada perfil, você define — tela por tela (Painel, Escalas, Cadastro de
  Profissionais, Relatórios, Tipos de Escala, Valores de Plantões,
  Competências, Usuários e Perfis) — o nível de acesso: **Sem acesso**,
  **Visualizar** ou **Editar**. O perfil "Administrador" é fixo e sempre
  tem acesso total, para o sistema nunca ficar sem administrador.
- **Relatórios separado de Fechamento** — agora são dois módulos
  distintos no menu. **"Fechamento"** é o cálculo mensal para pagamento
  (o que já existia). **"Relatórios"** é um catálogo com 18 tipos de
  relatório, todos com período livre (data início/fim, não só mês
  fechado), filtro de tipo(s) de escala e de profissional, e os botões
  🖨️ Imprimir/PDF, 📊 Excel (.xlsx) e 📄 CSV — no mesmo formato da tela
  de referência que você mandou:
  Afastamento, Faltas, Dados Bancários, Escalas, Extrapolamento de Horas
  (Mensal/Semanal), Financeiro, Financeiro (Individual e Consolidado),
  Financeiro Sintético, Financeiro Valor por Hora, Grupos dos Usuários,
  Horas Trabalhadas (Individual e Consolidado), Plantões, Plantões
  (Previsto x Realizados), Plantões Confirmados, Profissionais,
  Quantidade de Plantões, Quantidade de Plantões por Hora, e Troca e
  Passagens entre Profissionais.
  Alguns desses relatórios precisam de dados que o sistema ainda não
  tinha, então também adicionei:
  - **Afastamentos/Faltas por profissional** — um botão 🗓️ na tela de
    Cadastro de Profissionais para registrar férias, atestados, faltas
    etc.
  - **Limite de horas semanais/mensais por profissional** — novo campo
    no cadastro, usado no relatório de Extrapolamento.
  - **Histórico de trocas** — toda troca de plantão autorizada fica
    registrada (quem estava previsto originalmente e quem realmente
    ficou responsável), alimentando o relatório "Previsto x Realizados".
  "Plantões Confirmados" mostra os plantões que mudaram de mãos e foram
  confirmados via troca de plantão (é a informação de confirmação que o
  sistema realmente tem disponível).
- **Consultar Escalas** — novo módulo no menu, em formato de calendário
  mensal (visual, como na sua referência), disponível para **qualquer
  usuário cadastrado**, sempre somente leitura. É possível escolher o
  período (mês, com setas para navegar), marcar quais tipos de escala
  aparecem, e alternar entre **"👥 Escala completa"** e **"👤 Só meus
  plantões"** (esse filtro só aparece para quem está vinculado a um
  Profissional em "Usuários e Perfis"). A impressão sai exatamente igual
  à visualização em calendário.
- **Trocas de Plantão com confirmação por e-mail em 1 clique** — cada
  profissional clica no próprio plantão (na tela da escala) e solicita a
  troca com um colega, informando o motivo. O fluxo completo:
  1. O **colega escolhido** recebe um e-mail com o texto "TROCA DE
     PLANTÃO — entre Fulano e Ciclano", mostrando a entidade, o plantão,
     a data/horário e o motivo, com **dois botões reais dentro do
     e-mail: SIM e NÃO** — ele clica em um dos dois **sem precisar abrir
     o sistema nem fazer login**. O clique já registra a resposta na
     hora.
  2. Se ele clicar **SIM**: o profissional que pediu a troca recebe um
     e-mail avisando que foi confirmado, e o **Administrador e/ou Diretor
     Clínico** (perfis cadastrados no sistema, e que podem estar
     vinculados a uma entidade específica) recebem o e-mail "NOVA TROCA
     DE PLANTÃO" pedindo autorização.
  3. Se ele clicar **NÃO**: o profissional que pediu a troca recebe um
     e-mail avisando da recusa, para tentar novamente com outro colega.
  4. Só depois que o Administrador/Diretor Clínico **autoriza dentro do
     sistema**, a troca é feita automaticamente na escala — e ambos os
     profissionais recebem um e-mail final confirmando.
  Um novo perfil **"Diretor(a) Clínico(a)"** já vem pronto para isso,
  com permissão de autorizar trocas mas sem acesso administrativo total.
  Em "Usuários e Perfis", vincule cada login a um **Profissional** (para
  poder solicitar/confirmar trocas dos próprios plantões) e, se quiser,
  a uma **Entidade** específica (para o Administrador/Diretor só ser
  avisado das trocas daquele local).
- **Horário de início em cada código de plantão** — em "Tipos de
  Escala", cada código agora tem também um horário de início (além do
  nome, duração e cor), então o sistema sabe calcular automaticamente
  "De 02/08/2026 07:00 até 02/08/2026 19:00", por exemplo — usado nas
  trocas de plantão e mostrado ao passar o mouse sobre a célula da escala.
- **Menu principal organizado na ordem de uso** — o menu lateral agora
  segue a sequência lógica de como o sistema deve ser alimentado: primeiro
  os cadastros-base (1. Entidades, 2. Profissionais, 3. Tipos de Plantão,
  4. Valores de Plantões, 5. Usuários e Perfis, 6. Competências), depois
  a operação do dia a dia (as escalas mensais e as trocas de plantão), e
  por último o acompanhamento (Relatórios e Painel Geral).
- **Cadastro de Entidades** — novo módulo no menu principal para cadastrar
  cada local/unidade onde os plantões acontecem (ex.: UPA Central,
  Hospital Municipal), com CNPJ, Razão Social, Nome Fantasia, Endereço,
  Bairro, CEP, Telefone e E-mail. Como você tem mais de um local, isso
  permite manter tudo no mesmo sistema, organizado por entidade.
- **Vínculo de Profissionais e Escalas a uma Entidade** — no Cadastro de
  Profissionais, escolha em qual entidade cada pessoa trabalha. Em Tipos
  de Escala, vincule cada escala a uma entidade (ex.: "Plantões Médicos"
  da UPA Central e "Plantões Médicos" do Hospital Municipal podem ser dois
  tipos de escala separados, cada um vinculado à sua entidade). O nome da
  entidade aparece no menu lateral, no cadastro de profissionais e no
  topo da grade de cada escala, para você nunca confundir os locais.
  clique em **"+ Novo Usuário"** para criar login e senha de qualquer
  pessoa na hora, sem precisar que ela mesma se cadastre pela tela de
  login. Combine a senha provisória com a pessoa, ou use o botão
  **"🔑 Redefinir senha"** depois para que ela receba um e-mail e escolha
  a própria senha.
- **Login por e-mail/senha**, com aprovação de acesso por perfil (para
  quem preferir se cadastrar sozinho pela tela de login).
- **Tipos de escala ilimitados, criados por você** — em "Tipos de Escala"
  (perfil Administrador/Coordenador), crie quantas escalas quiser além das
  3 originais (Plantões, Transferências, Visitas): por exemplo "Escala -
  Enfermagem", "Escala - Técnicos de Enfermagem", "Escala - Motoristas"
  etc. Para cada uma, você define os próprios códigos (letra/sigla, nome,
  quantas horas valem e a cor). Cada tipo de escala vira automaticamente
  um item novo no menu lateral, com sua própria grade mensal.
- **Valores de Plantões configuráveis por hora** — em "Valores de
  Plantões" (Administrador), cadastre quantas regras de pagamento
  precisar no formato Descrição / Tipo de escala / Categoria profissional
  / Valor por hora. O sistema sempre calcula em cima de horas: pega as
  horas de cada código lançado na escala e multiplica pelo valor/hora
  mais específico encontrado (mesmo tipo de escala + mesma categoria do
  profissional primeiro; se não achar, vai afrouxando a busca).
- **Competências** — uma tela dedicada (Administrador/Coordenador) que
  lista todos os meses (passados e futuros) e permite **fechar** uma
  competência para travar novas edições na escala daquele mês, preservando
  o registro histórico para consultas e relatórios futuros. Reabrir é
  possível a qualquer momento pelo Administrador. Nenhum dado é apagado ao
  fechar — a competência fechada continua 100% disponível para consulta e
  impressão, só fica protegida contra alterações acidentais.
- **Categoria por profissional** (Médico, Enfermeiro, Técnico de
  Enfermagem, Coordenador, Outro) — usada para aplicar o valor/hora certo
  automaticamente.
- **4 tipos de relatório**, todos com o mesmo período (mês/ano):
  - **Completo**: todos os profissionais, com uma coluna de horas para
    cada tipo de escala e o total a pagar.
  - **Por tipo de escala**: só Plantões, só Transferências, só Visitas,
    ou qualquer escala nova que você criar — Profissional, horas,
    valor/hora aplicado e total.
  - **Por profissional**: extrato individual dia a dia (equivalente a um
    "contracheque" de plantões), somando todos os tipos de escala.
- **Exportação de relatórios em 3 formatos**: 🖨️ Imprimir/PDF (usa a
  função de impressão do navegador — escolha "Salvar como PDF" na janela
  de impressão), 📊 Excel (.xlsx) e 📄 CSV — os três a partir do último
  relatório gerado na tela.
- **Painel/Dashboard** com indicadores do mês, seletor de tipo de escala,
  gráfico de horas por profissional, distribuição por código e evolução
  dos últimos 6 meses.
- **Cadastro de profissionais** (nome, categoria, CRM/COREN, CPF, dados
  bancários, PIX, emissão de nota fiscal).
- **Gestão de usuários e perfis** pela própria interface.

## 🔧 Para evoluir depois
Ideias fáceis de acrescentar no mesmo padrão de código: histórico de
alterações da escala (quem mudou o quê e quando), solicitação de troca de
plantão entre profissionais, notificações por e-mail quando uma
competência é fechada, campo de observações por dia na grade, e vincular
este sistema ao seu projeto existente `controle-exames` como um segundo
módulo do mesmo painel.
