/* =========================================================================
   SISTEMA DE CONTROLE DE PLANTÕES MÉDICOS - JABORANDI/SP
   Lógica principal (JavaScript puro + Firebase)
   ========================================================================= */

// -------------------------------------------------------------------------
// 0. CONSTANTES E DADOS INICIAIS (extraídos da planilha original)
// -------------------------------------------------------------------------
const SETORES = {
  plantoes:       { label: "Plantões Médicos",           codigos: ["N","D","T","M","24","18","6","F"] },
  transferencias: { label: "Transferências Médicas",      codigos: ["N","D","T","M","24","18","6","F"] },
  visitas:        { label: "Visitas Médicas / Internações", codigos: ["V","F"] }
};

const NOME_CODIGO = { N:"Noite", D:"Dia", T:"Tarde", M:"Manhã", "24":"24 Horas", "18":"18 Horas", "6":"06 Horas", F:"Férias", V:"Visita" };

const PERFIS = {
  administrador:      { label: "Administrador",          cor:"badge-vermelho" },
  coordenador:        { label: "Coordenador de Escalas",  cor:"badge-azul" },
  medico:             { label: "Médico(a)",               cor:"badge-verde" },
  enfermeiro:         { label: "Enfermeiro(a)",            cor:"badge-verde" },
  tecnico_enfermagem: { label: "Técnico(a) de Enfermagem", cor:"badge-cinza" },
  pendente:           { label: "Aguardando aprovação",     cor:"badge-cinza" }
};

// quem pode ENTRAR em cada tela
const NAV = [
  { id:"dashboard",              label:"Painel Geral",             icone:"📊", perfis:["administrador","coordenador","medico","enfermeiro","tecnico_enfermagem"] },
  { id:"escala-plantoes",        label:"Escala · Plantões",         icone:"🩺", perfis:["administrador","coordenador","medico","enfermeiro","tecnico_enfermagem"] },
  { id:"escala-transferencias",  label:"Escala · Transferências",   icone:"🚑", perfis:["administrador","coordenador","medico","enfermeiro","tecnico_enfermagem"] },
  { id:"escala-visitas",         label:"Escala · Visitas",          icone:"🏥", perfis:["administrador","coordenador","medico","enfermeiro","tecnico_enfermagem"] },
  { id:"profissionais",          label:"Profissionais",             icone:"👥", perfis:["administrador","coordenador","medico","enfermeiro"] },
  { id:"relatorios",             label:"Relatórios / Fechamento",   icone:"🧾", perfis:["administrador","coordenador","medico","enfermeiro"] },
  { id:"usuarios",               label:"Usuários e Perfis",         icone:"🔑", perfis:["administrador"] },
  { id:"configuracoes",          label:"Configurações",             icone:"⚙️", perfis:["administrador"] },
];

// quem pode EDITAR escalas / cadastro
const PODE_EDITAR_ESCALA = ["administrador","coordenador"];
const PODE_EDITAR_PROFISSIONAIS = ["administrador","coordenador"];

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DIAS_SEMANA = ["dom","seg","ter","qua","qui","sex","sáb"];

const VALORES_PADRAO = { valorPlantao12h: 950, valorTransf12h: 330, valorVisitaDia: 233.33, responsavelEscala: 1500 };
const HORAS_PADRAO   = { M:6, T:12, D:12, N:12, "24":24, "18":18, "6":6, F:0, V:0 };

// Cadastro inicial dos profissionais (importado da planilha CONTAGEM DE PLANTÕES MÉDICOS 1.1)
const PROFISSIONAIS_INICIAIS = [{"id": "4", "nome": "ALEXANDRE PONTES GERONYMO", "crm": "167420", "cpf": "22173921827", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "11986583937", "emiteNF": false, "ativo": true}, {"id": "5", "nome": "ANA LAURA JUNQUEIRA DE SOUZA", "crm": "249561", "cpf": "43692166800", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "53188821000160", "emiteNF": false, "ativo": true}, {"id": "6", "nome": "ANA PAULA MACEDO DE PAULA", "crm": "264529", "cpf": "5655667177", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "5655667177", "emiteNF": false, "ativo": true}, {"id": "22", "nome": "ANDRE SILVEIRA FONSECA", "crm": "155487", "cpf": "1640304177", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "1640304177", "emiteNF": false, "ativo": true}, {"id": "23", "nome": "ANGELA NATALIA GONÇALVES RABELO", "crm": "269678", "cpf": "3807318275", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "3807318275", "emiteNF": false, "ativo": true}, {"id": "24", "nome": "ANTONIO HENRIQUE R. B. DA SILVA", "crm": "182600", "cpf": "34140935880", "agencia": "1977", "nomeAgencia": "SANTANDER", "conta": "01000137-2", "pix": "26789589000142", "emiteNF": true, "ativo": true}, {"id": "25", "nome": "ARTHUR ANTONIO CANTISANO", "crm": "274045", "cpf": "41493104837", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "41493104837", "emiteNF": false, "ativo": true}, {"id": "26", "nome": "BEATRIZ CHIOZZINI PORTO", "crm": "252841", "cpf": "14997052079", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "14997052079", "emiteNF": false, "ativo": true}, {"id": "27", "nome": "BIANCA RIBESSI TEIXEIRA", "crm": "239077", "cpf": "41533401896", "agencia": "1739", "nomeAgencia": "BRADESCO", "conta": "0012228-9", "pix": "19999663987", "emiteNF": false, "ativo": true}, {"id": "28", "nome": "BRUNO DENARDI LEMOS", "crm": "238746", "cpf": "40982479840", "agencia": "3188", "nomeAgencia": "", "conta": "547611", "pix": "40982479840", "emiteNF": false, "ativo": true}, {"id": "29", "nome": "DANIEL APARECIDO DOS SANTOS", "crm": "188127", "cpf": "7672477609", "agencia": "3619", "nomeAgencia": "BRADESCO", "conta": "350029-2", "pix": "danieldossantosmed@gmail.com", "emiteNF": false, "ativo": true}, {"id": "30", "nome": "DIANA GOMES BASILIO", "crm": "233706", "cpf": "41093753803", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "41093753803", "emiteNF": false, "ativo": true}, {"id": "31", "nome": "DIEGO SARMIENTO BRUNO", "crm": "261973", "cpf": "32244168841", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "32244168841", "emiteNF": false, "ativo": true}, {"id": "32", "nome": "EMILIO PEREIRA DE SOUSA", "crm": "254042", "cpf": "43978794861", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "537978610001053", "emiteNF": true, "ativo": true}, {"id": "33", "nome": "FILIPE SILVA COSTA", "crm": "249670", "cpf": "13561862624", "agencia": "0502-9", "nomeAgencia": "BANCO DO BRASIL", "conta": "26667-1", "pix": "13561862624", "emiteNF": false, "ativo": true}, {"id": "34", "nome": "GABRIELA COLEHO GIAQUETO", "crm": "252849", "cpf": "44551699896", "agencia": "0001", "nomeAgencia": "INTER", "conta": "33006686-2", "pix": "dragabrielagiaqueto@outlook.com", "emiteNF": false, "ativo": true}, {"id": "35", "nome": "GIOVANA ALMEIDA F. ALONSO", "crm": "239151", "cpf": "31473729874", "agencia": "1", "nomeAgencia": "INTER", "conta": "3472876-7", "pix": "15981244334", "emiteNF": false, "ativo": true}, {"id": "36", "nome": "GUILHERME HENRIQUE PUPIM GARCIA", "crm": "238824", "cpf": "38773251810", "agencia": "0001", "nomeAgencia": "INTER", "conta": "26559583-5", "pix": "48951722000158", "emiteNF": false, "ativo": true}, {"id": "37", "nome": "GUSTAVO BELFORT TEIXEIRA", "crm": "238830", "cpf": "49917685863", "agencia": "3146", "nomeAgencia": "ITAU", "conta": "465756", "pix": "3500536000164", "emiteNF": false, "ativo": true}, {"id": "38", "nome": "ISRAEL DE SOUZA MARQUES", "crm": "245275", "cpf": "33275156896", "agencia": "1989", "nomeAgencia": "SANTANDER", "conta": "01001172-3", "pix": "33275156896", "emiteNF": false, "ativo": true}, {"id": "39", "nome": "ITALO GABRIEL BELTRAMEVAZZOLER", "crm": "246844", "cpf": "44695282852", "agencia": "0001", "nomeAgencia": "NUBANK", "conta": "96587119-1", "pix": "44695282852", "emiteNF": false, "ativo": true}, {"id": "40", "nome": "JOAO VICTOR TOGO CAMILO", "crm": "252188", "cpf": "47652441803", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "53313108000109", "emiteNF": true, "ativo": true}, {"id": "41", "nome": "JULIA RODRIGUES DE ALMEIDA", "crm": "245079", "cpf": "44385910820", "agencia": "2461-9", "nomeAgencia": "", "conta": "108248-5", "pix": "16993252651", "emiteNF": false, "ativo": true}, {"id": "42", "nome": "JULIANA DE OLIVEIRA LANNES", "crm": "216321", "cpf": "30166461881", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "301.664.618-81", "emiteNF": false, "ativo": true}, {"id": "43", "nome": "KAMILLE ANIK CALVO", "crm": "238874", "cpf": "45645860845", "agencia": "8649", "nomeAgencia": "ITAU", "conta": "04650-18'", "pix": "45645860845", "emiteNF": false, "ativo": true}, {"id": "44", "nome": "LAISA RODRIGUES", "crm": "216512", "cpf": "39990577854", "agencia": "0024", "nomeAgencia": "SANTANDER", "conta": "01031426-5", "pix": "39990577854", "emiteNF": false, "ativo": true}, {"id": "45", "nome": "LARISSA ROSA FERNANDES", "crm": "241466", "cpf": "35401434839", "agencia": "0715", "nomeAgencia": "", "conta": "71701-9", "pix": "fernandes99lari@gmail.com", "emiteNF": false, "ativo": true}, {"id": "46", "nome": "LEANDRO FRANCISCHINI DIBI", "crm": "129536", "cpf": "31506837859", "agencia": "0504", "nomeAgencia": "SANTANDER", "conta": "01003807-8", "pix": "17991863870", "emiteNF": false, "ativo": true}, {"id": "47", "nome": "LIVIA BORGES DE SOUZA", "crm": "91541", "cpf": "10373605676", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "1640304177", "emiteNF": false, "ativo": true}, {"id": "48", "nome": "LORENA CHABOLI DOS SANTOS", "crm": "252859", "cpf": "46766872810", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "44003681000117", "emiteNF": true, "ativo": true}, {"id": "49", "nome": "LUIZ FERNANDO DE CARVALHO SCAGLIONE", "crm": "217769", "cpf": "36991398837", "agencia": "3188", "nomeAgencia": "SICOOB 756", "conta": "119663-4", "pix": "36991398837", "emiteNF": false, "ativo": true}, {"id": "50", "nome": "LUIZA DOURADO SILVA MUNIZ", "crm": "227143", "cpf": "2305191138", "agencia": "0001", "nomeAgencia": "C6 S.A.", "conta": "4690352-6", "pix": "2305191138", "emiteNF": false, "ativo": true}, {"id": "51", "nome": "MARCELO CAUSIN BENEDETI", "crm": "238491", "cpf": "45524470841", "agencia": "0001", "nomeAgencia": "C6 S.A.", "conta": "22850825-8", "pix": "48730982000101", "emiteNF": false, "ativo": true}, {"id": "52", "nome": "MARIA EDUARDA COSTA S. RIBEIRO", "crm": "210880", "cpf": "9928412677", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "duda.sribeiro@hotmail.com", "emiteNF": false, "ativo": true}, {"id": "53", "nome": "MARIA EDUARDA GARCIA PALHARINI", "crm": "251329", "cpf": "42745639870", "agencia": "3188", "nomeAgencia": "SICOOB CREDICITRUS", "conta": "103196-1", "pix": "42745639870", "emiteNF": false, "ativo": true}, {"id": "54", "nome": "MARIA EDUARDA ROVARIS", "crm": "253607", "cpf": "45193905838", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "45193905838", "emiteNF": false, "ativo": true}, {"id": "55", "nome": "MARIA LUIZA SUED ANDRADE", "crm": "272414", "cpf": "12183242795", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "mrsued11@gmail.com", "emiteNF": false, "ativo": true}, {"id": "56", "nome": "MARIA THEREZA SANTOS CIRINO", "crm": "252861", "cpf": "47238653818", "agencia": "0001", "nomeAgencia": "NU PAGAMENTOS S.A.", "conta": "55329362-8", "pix": "17992459796", "emiteNF": false, "ativo": true}, {"id": "57", "nome": "MONIQUE ROSSATO DA CUNHA", "crm": "246027", "cpf": "43608037888", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "43608037888", "emiteNF": false, "ativo": true}, {"id": "58", "nome": "OTAVIO PEREIRA DE SOUSA", "crm": "254069", "cpf": "45779851875", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "otaviosev99@gmail.com", "emiteNF": false, "ativo": true}, {"id": "59", "nome": "PEDRO HENRIQUE OLIVEIRA M. ARAUJO", "crm": "238968", "cpf": "43768643824", "agencia": "0001", "nomeAgencia": "NU PAGAMENTOS S.A.", "conta": "99332911-8", "pix": "17991016969", "emiteNF": false, "ativo": true}, {"id": "60", "nome": "PEDRO ROSA", "crm": "224594", "cpf": "38327122835", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "38327122835", "emiteNF": false, "ativo": true}, {"id": "61", "nome": "SALUA OLIVARI NASSBINE FERREIRA", "crm": "134300", "cpf": "28294295807", "agencia": "3214", "nomeAgencia": "SICOOB COCRED", "conta": "41357-7", "pix": "17991353261", "emiteNF": false, "ativo": true}, {"id": "62", "nome": "SIMONE PATRICIA MASARI", "crm": "334049", "cpf": "37701962875", "agencia": "0367", "nomeAgencia": "SANTANDER", "conta": "01003291-0", "pix": "37701962875", "emiteNF": false, "ativo": true}, {"id": "63", "nome": "SUHAYLA NASSBINE S. MEDEIROS", "crm": "169388", "cpf": "38812802869", "agencia": "3214", "nomeAgencia": "SICOOB", "conta": "36369-3", "pix": "28697909880", "emiteNF": false, "ativo": true}, {"id": "64", "nome": "VANISSA OLIVARI NASSBINE SILVA", "crm": "107459", "cpf": "18333830770", "agencia": "", "nomeAgencia": "BRADESCO NET EMPRESA", "conta": "10344-6", "pix": "dravanissanassbine@gmail.com", "emiteNF": false, "ativo": true}, {"id": "65", "nome": "VICTORIA DEL MORO CESPEDES", "crm": "252866", "cpf": "11438783612", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "11438783612", "emiteNF": false, "ativo": true}, {"id": "66", "nome": "WASHINGTON LUIZ DOS SANTOS", "crm": "64973", "cpf": "49609203604", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "NÃO POSSUI", "emiteNF": false, "ativo": true}, {"id": "67", "nome": "YURI PEIXOTO TELLES", "crm": "250018", "cpf": "44379065863", "agencia": "", "nomeAgencia": "NUBANK", "conta": "5339707-7", "pix": "44379065863", "emiteNF": false, "ativo": true}, {"id": "68", "nome": "MARCELO ALEXANDRE G. JUNIOR", "crm": "264906", "cpf": "47042118863", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "47042118863", "emiteNF": false, "ativo": true}, {"id": "69", "nome": "YASMIN MEDEIROS GUIMARAES", "crm": "265102", "cpf": "40501761810", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "58098029000138", "emiteNF": false, "ativo": true}, {"id": "70", "nome": "DECIO BORGES DA COSTA NETO", "crm": "112806", "cpf": "9928410623", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "34992410637", "emiteNF": false, "ativo": true}, {"id": "71", "nome": "LAIS WORLICZEK DE CAMARGO", "crm": "264829", "cpf": "401.182.738-09", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "lais.camargo1@hotmail.com", "emiteNF": false, "ativo": true}, {"id": "72", "nome": "ANA CLARA JUNQUEIRA TEDESCHI", "crm": "281953", "cpf": "387.363.638-71", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "387.363.638-71", "emiteNF": false, "ativo": true}, {"id": "73", "nome": "LARISSA CAMPAGNON DA SILVA", "crm": "282331", "cpf": "33931667863", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "33931667863", "emiteNF": false, "ativo": true}, {"id": "74", "nome": "LARA RIBEIRO DE OLIVEIRA", "crm": "282327", "cpf": "488.162.628-00", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "48816262800", "emiteNF": false, "ativo": true}, {"id": "75", "nome": "ANA LAURA GARCIA DE MENEZES", "crm": "282877", "cpf": "438.078.918-70", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "438.078.918-70", "emiteNF": false, "ativo": true}, {"id": "76", "nome": "ISAQUE PEIXOTO RIBEIRO", "crm": "283183", "cpf": "441.086.418-17", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "64643529000106", "emiteNF": true, "ativo": true}];

// -------------------------------------------------------------------------
// 1. ESTADO GLOBAL
// -------------------------------------------------------------------------
let ESTADO = {
  usuario: null,        // objeto do Firebase Auth
  usuarioDoc: null,      // { nome, email, perfil, ativo }
  telaAtual: "dashboard",
  cacheProfissionais: [],
  cacheValores: VALORES_PADRAO,
  cacheHoras: HORAS_PADRAO,
  escalaAtual: { setor: "plantoes", mes: new Date().getMonth()+1, ano: new Date().getFullYear() },
};

const $app = document.getElementById("app");

// -------------------------------------------------------------------------
// 2. AUTENTICAÇÃO
// -------------------------------------------------------------------------
auth.onAuthStateChanged(async (user) => {
  if (!user) { ESTADO.usuario = null; ESTADO.usuarioDoc = null; renderLogin(); return; }
  ESTADO.usuario = user;
  const ref = db.collection("usuarios").doc(user.uid);
  const snap = await ref.get();
  if (!snap.exists) {
    const novo = { nome: user.email.split("@")[0], email: user.email, perfil: "pendente", ativo: false, criadoEm: Date.now() };
    await ref.set(novo);
    ESTADO.usuarioDoc = novo;
  } else {
    ESTADO.usuarioDoc = snap.data();
  }
  if (!ESTADO.usuarioDoc.ativo) { renderPendente(); return; }
  await carregarConfiguracoes();
  renderApp();
});

function renderLogin() {
  $app.innerHTML = `
  <div class="tela-login">
    <div class="cartao-login">
      <h1>🏥 Controle de Plantões Médicos</h1>
      <div class="sub">Secretaria Municipal de Saúde de Jaborandi</div>
      <div id="areaMsg"></div>
      <form id="formLogin">
        <div class="campo"><label>E-mail</label><input type="email" id="loginEmail" required placeholder="seuemail@exemplo.com"></div>
        <div class="campo"><label>Senha</label><input type="password" id="loginSenha" required placeholder="••••••••"></div>
        <button class="btn btn-primario" type="submit">Entrar</button>
      </form>
      <button class="link-alt" id="btnAlternarCadastro">Ainda não tenho acesso — criar conta</button>
    </div>
  </div>`;

  document.getElementById("formLogin").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const senha = document.getElementById("loginSenha").value;
    try { await auth.signInWithEmailAndPassword(email, senha); }
    catch (err) { mostrarMsg(traduzErro(err), "erro"); }
  });

  document.getElementById("btnAlternarCadastro").addEventListener("click", renderCadastro);
}

function renderCadastro() {
  $app.innerHTML = `
  <div class="tela-login">
    <div class="cartao-login">
      <h1>Criar acesso</h1>
      <div class="sub">Seu cadastro ficará pendente até um administrador liberar seu perfil de acesso.</div>
      <div id="areaMsg"></div>
      <form id="formCadastro">
        <div class="campo"><label>Nome completo</label><input type="text" id="cadNome" required></div>
        <div class="campo"><label>E-mail</label><input type="email" id="cadEmail" required></div>
        <div class="campo"><label>Senha (mín. 6 caracteres)</label><input type="password" id="cadSenha" minlength="6" required></div>
        <button class="btn btn-primario" type="submit">Criar conta</button>
      </form>
      <button class="link-alt" id="btnVoltarLogin">Já tenho conta — entrar</button>
    </div>
  </div>`;

  document.getElementById("formCadastro").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nome = document.getElementById("cadNome").value.trim();
    const email = document.getElementById("cadEmail").value.trim();
    const senha = document.getElementById("cadSenha").value;
    try {
      const cred = await auth.createUserWithEmailAndPassword(email, senha);
      await db.collection("usuarios").doc(cred.user.uid).set({ nome, email, perfil:"pendente", ativo:false, criadoEm: Date.now() });
    } catch (err) { mostrarMsg(traduzErro(err), "erro"); }
  });
  document.getElementById("btnVoltarLogin").addEventListener("click", renderLogin);
}

function renderPendente() {
  $app.innerHTML = `
    <div class="pendente-box">
      <h2>⏳ Cadastro em análise</h2>
      <p>Olá, <b>${escapeHtml(ESTADO.usuarioDoc.nome)}</b>. Sua conta foi criada, mas ainda não tem um perfil de acesso liberado.
      Peça a um <b>Administrador</b> do sistema para liberar seu acesso na tela "Usuários e Perfis".</p>
      <button class="btn btn-secundario" id="btnSair">Sair</button>
    </div>`;
  document.getElementById("btnSair").addEventListener("click", () => auth.signOut());
}

function mostrarMsg(msg, tipo) {
  const el = document.getElementById("areaMsg");
  if (el) el.innerHTML = `<div class="${tipo === "erro" ? "msg-erro" : "msg-ok"}">${msg}</div>`;
}

function traduzErro(err) {
  const map = {
    "auth/user-not-found": "Usuário não encontrado.",
    "auth/wrong-password": "Senha incorreta.",
    "auth/invalid-email": "E-mail inválido.",
    "auth/email-already-in-use": "Este e-mail já está cadastrado.",
    "auth/weak-password": "Senha muito curta (mínimo 6 caracteres).",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
  };
  return map[err.code] || ("Erro: " + err.message);
}

// -------------------------------------------------------------------------
// 3. CARREGAR CONFIGURAÇÕES (valores de pagamento e conversão de horas)
// -------------------------------------------------------------------------
async function carregarConfiguracoes() {
  const vSnap = await db.collection("configuracoes").doc("valores").get();
  ESTADO.cacheValores = vSnap.exists ? vSnap.data() : VALORES_PADRAO;
  if (!vSnap.exists) await db.collection("configuracoes").doc("valores").set(VALORES_PADRAO);

  const hSnap = await db.collection("configuracoes").doc("horas").get();
  ESTADO.cacheHoras = hSnap.exists ? hSnap.data() : HORAS_PADRAO;
  if (!hSnap.exists) await db.collection("configuracoes").doc("horas").set(HORAS_PADRAO);
}

// -------------------------------------------------------------------------
// 4. SHELL DO APP + ROTEAMENTO
// -------------------------------------------------------------------------
function podeAcessar(telaId) {
  const item = NAV.find(n => n.id === telaId);
  return item && item.perfis.includes(ESTADO.usuarioDoc.perfil);
}

function renderApp() {
  const perfil = ESTADO.usuarioDoc.perfil;
  const navHtml = NAV.filter(n => n.perfis.includes(perfil)).map(n => `
    <div class="nav-item ${ESTADO.telaAtual === n.id ? "ativo" : ""}" data-tela="${n.id}">
      <span>${n.icone}</span><span>${n.label}</span>
    </div>`).join("");

  $app.innerHTML = `
    <div class="app">
      <div class="barra-lateral" id="barraLateral">
        <div class="logo">🏥 Plantões Jaborandi<small>Secretaria Municipal de Saúde</small></div>
        <nav>${navHtml}</nav>
        <div class="rodape-lateral">
          <div>${escapeHtml(ESTADO.usuarioDoc.nome)}</div>
          <span class="perfil-tag">${PERFIS[perfil]?.label || perfil}</span>
          <button id="btnSair">Sair do sistema</button>
        </div>
      </div>
      <div class="conteudo">
        <button class="abrir-menu-mobile" id="btnMenuMobile">☰ Menu</button>
        <div id="viewport"></div>
      </div>
    </div>`;

  document.querySelectorAll(".nav-item").forEach(el => el.addEventListener("click", () => {
    ESTADO.telaAtual = el.dataset.tela;
    document.getElementById("barraLateral").classList.remove("aberta");
    renderApp();
  }));
  document.getElementById("btnSair").addEventListener("click", () => auth.signOut());
  document.getElementById("btnMenuMobile").addEventListener("click", () => document.getElementById("barraLateral").classList.toggle("aberta"));

  if (!podeAcessar(ESTADO.telaAtual)) ESTADO.telaAtual = "dashboard";

  const rotas = {
    "dashboard": renderDashboard,
    "escala-plantoes": () => renderEscala("plantoes"),
    "escala-transferencias": () => renderEscala("transferencias"),
    "escala-visitas": () => renderEscala("visitas"),
    "profissionais": renderProfissionais,
    "relatorios": renderRelatorios,
    "usuarios": renderUsuarios,
    "configuracoes": renderConfiguracoes,
  };
  (rotas[ESTADO.telaAtual] || renderDashboard)();
}

function escapeHtml(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function fmtMoeda(v) { return (v || 0).toLocaleString("pt-BR", { style:"currency", currency:"BRL" }); }

// -------------------------------------------------------------------------
// 5. PROFISSIONAIS (cadastro)
// -------------------------------------------------------------------------
async function carregarProfissionais(forcar=false) {
  if (ESTADO.cacheProfissionais.length && !forcar) return ESTADO.cacheProfissionais;
  const snap = await db.collection("profissionais").orderBy("nome").get();
  ESTADO.cacheProfissionais = snap.docs.map(d => ({ id:d.id, ...d.data() }));
  return ESTADO.cacheProfissionais;
}

async function renderProfissionais() {
  const vp = document.getElementById("viewport");
  vp.innerHTML = `<div class="cartao">Carregando...</div>`;
  const lista = await carregarProfissionais(true);
  const podeEditar = PODE_EDITAR_PROFISSIONAIS.includes(ESTADO.usuarioDoc.perfil);

  vp.innerHTML = `
    <div class="cabecalho-pagina">
      <div><h2>Profissionais</h2><div class="desc">${lista.length} profissionais cadastrados</div></div>
      ${podeEditar ? `<div class="acoes-topo" style="display:flex;gap:8px">
        ${lista.length === 0 ? `<button class="btn btn-secundario" id="btnImportar">📥 Importar lista da planilha (${PROFISSIONAIS_INICIAIS.length})</button>` : ""}
        <button class="btn btn-primario" id="btnNovoProf">+ Novo profissional</button>
      </div>` : ""}
    </div>
    <div class="cartao" style="overflow:auto">
      <table class="tabela" id="tabelaProf">
        <thead><tr><th>Nome</th><th>CRM</th><th>CPF</th><th>PIX</th><th>Emite N.F.</th><th>Status</th>${podeEditar?"<th></th>":""}</tr></thead>
        <tbody>
          ${lista.map(p => `
            <tr>
              <td>${escapeHtml(p.nome)}</td>
              <td>${escapeHtml(p.crm||"-")}</td>
              <td>${escapeHtml(p.cpf||"-")}</td>
              <td>${escapeHtml(p.pix||"-")}</td>
              <td>${p.emiteNF ? '<span class="badge badge-azul">SIM</span>' : '<span class="badge badge-cinza">NÃO</span>'}</td>
              <td>${p.ativo !== false ? '<span class="badge badge-verde">Ativo</span>' : '<span class="badge badge-vermelho">Inativo</span>'}</td>
              ${podeEditar ? `<td>
                  <button class="icone-acao" data-editar="${p.id}" title="Editar">✏️</button>
                  <button class="icone-acao" data-excluir="${p.id}" title="Excluir">🗑️</button>
                </td>` : ""}
            </tr>`).join("")}
        </tbody>
      </table>
    </div>`;

  if (podeEditar) {
    document.getElementById("btnNovoProf").addEventListener("click", () => modalProfissional());
    document.getElementById("btnImportar")?.addEventListener("click", importarProfissionaisIniciais);
    vp.querySelectorAll("[data-editar]").forEach(b => b.addEventListener("click", () => {
      const prof = lista.find(p => p.id === b.dataset.editar);
      modalProfissional(prof);
    }));
    vp.querySelectorAll("[data-excluir]").forEach(b => b.addEventListener("click", async () => {
      if (!confirm("Excluir este profissional? Esta ação não pode ser desfeita.")) return;
      await db.collection("profissionais").doc(b.dataset.excluir).delete();
      renderProfissionais();
    }));
  }
}

async function importarProfissionaisIniciais() {
  if (!confirm(`Importar ${PROFISSIONAIS_INICIAIS.length} profissionais da planilha original?`)) return;
  const lote = db.batch();
  PROFISSIONAIS_INICIAIS.forEach(p => {
    const ref = db.collection("profissionais").doc();
    lote.set(ref, { nome:p.nome, crm:p.crm, cpf:p.cpf, agencia:p.agencia, nomeAgencia:p.nomeAgencia, conta:p.conta, pix:p.pix, emiteNF:p.emiteNF, ativo:true });
  });
  await lote.commit();
  renderProfissionais();
}

function modalProfissional(prof) {
  const editando = !!prof;
  const p = prof || { nome:"",crm:"",cpf:"",agencia:"",nomeAgencia:"",conta:"",pix:"",emiteNF:false,ativo:true };
  const div = document.createElement("div");
  div.className = "modal-fundo";
  div.innerHTML = `
    <div class="modal">
      <h3>${editando ? "Editar" : "Novo"} profissional</h3>
      <div class="campo"><label>Nome completo</label><input id="mNome" value="${escapeHtml(p.nome)}"></div>
      <div class="campos-2">
        <div class="campo"><label>CRM/COREN</label><input id="mCrm" value="${escapeHtml(p.crm)}"></div>
        <div class="campo"><label>CPF/CNPJ</label><input id="mCpf" value="${escapeHtml(p.cpf)}"></div>
        <div class="campo"><label>Agência</label><input id="mAgencia" value="${escapeHtml(p.agencia)}"></div>
        <div class="campo"><label>Nome do banco</label><input id="mNomeAgencia" value="${escapeHtml(p.nomeAgencia)}"></div>
        <div class="campo"><label>Conta corrente</label><input id="mConta" value="${escapeHtml(p.conta)}"></div>
        <div class="campo"><label>PIX</label><input id="mPix" value="${escapeHtml(p.pix)}"></div>
      </div>
      <div class="campo"><label><input type="checkbox" id="mEmiteNF" ${p.emiteNF?"checked":""}> Emite Nota Fiscal</label></div>
      <div class="campo"><label><input type="checkbox" id="mAtivo" ${p.ativo!==false?"checked":""}> Ativo</label></div>
      <div class="acoes">
        <button class="btn btn-secundario" id="mCancelar">Cancelar</button>
        <button class="btn btn-primario" id="mSalvar">Salvar</button>
      </div>
    </div>`;
  document.body.appendChild(div);
  div.querySelector("#mCancelar").addEventListener("click", () => div.remove());
  div.querySelector("#mSalvar").addEventListener("click", async () => {
    const dados = {
      nome: div.querySelector("#mNome").value.trim(),
      crm: div.querySelector("#mCrm").value.trim(),
      cpf: div.querySelector("#mCpf").value.trim(),
      agencia: div.querySelector("#mAgencia").value.trim(),
      nomeAgencia: div.querySelector("#mNomeAgencia").value.trim(),
      conta: div.querySelector("#mConta").value.trim(),
      pix: div.querySelector("#mPix").value.trim(),
      emiteNF: div.querySelector("#mEmiteNF").checked,
      ativo: div.querySelector("#mAtivo").checked,
    };
    if (!dados.nome) { alert("Informe o nome."); return; }
    if (editando) await db.collection("profissionais").doc(p.id).update(dados);
    else await db.collection("profissionais").doc().set(dados);
    div.remove();
    renderProfissionais();
  });
}

// -------------------------------------------------------------------------
// 6. ESCALA (grade mensal por setor)
// -------------------------------------------------------------------------
function diasNoMes(ano, mes) { return new Date(ano, mes, 0).getDate(); }
function diaDaSemana(ano, mes, dia) { return new Date(ano, mes-1, dia).getDay(); }

async function renderEscala(setor) {
  ESTADO.escalaAtual.setor = setor;
  const { mes, ano } = ESTADO.escalaAtual;
  const vp = document.getElementById("viewport");
  vp.innerHTML = `<div class="cartao">Carregando escala...</div>`;

  const profissionais = (await carregarProfissionais()).filter(p => p.ativo !== false);
  const totalDias = diasNoMes(ano, mes);
  const codigos = SETORES[setor].codigos;
  const podeEditar = PODE_EDITAR_ESCALA.includes(ESTADO.usuarioDoc.perfil);

  // carrega os documentos de escala do mês/setor
  const snap = await db.collection("escalas").where("setor","==",setor).where("ano","==",ano).where("mes","==",mes).get();
  const escalasPorProf = {};
  snap.docs.forEach(d => { escalasPorProf[d.data().profissionalId] = { id:d.id, ...d.data() }; });

  const anosOpcoes = [];
  for (let a = new Date().getFullYear()-1; a <= new Date().getFullYear()+1; a++) anosOpcoes.push(a);

  vp.innerHTML = `
    <div class="cabecalho-pagina">
      <div><h2>${SETORES[setor].label}</h2><div class="desc">${podeEditar ? "Clique numa célula para alterar o código do plantão." : "Modo somente leitura."}</div></div>
    </div>
    <div class="barra-ferramentas">
      <select id="selMes">${MESES.map((m,i)=>`<option value="${i+1}" ${i+1===mes?"selected":""}>${m}</option>`).join("")}</select>
      <select id="selAno">${anosOpcoes.map(a=>`<option value="${a}" ${a===ano?"selected":""}>${a}</option>`).join("")}</select>
      <button class="btn btn-secundario" id="btnImprimirEscala">🖨️ Imprimir</button>
    </div>
    <div class="cartao">
      <div class="wrapper-escala">
        <table class="escala" id="tabelaEscala">
          <thead>
            <tr>
              <th class="col-nome">Profissional</th>
              ${Array.from({length:totalDias},(_,i)=>{
                const d=i+1; const dsem=diaDaSemana(ano,mes,d); const fds = dsem===0||dsem===6;
                return `<th class="${fds?'fds':''}">${d}<br><small>${DIAS_SEMANA[dsem]}</small></th>`;
              }).join("")}
              <th>Total 12h</th>
            </tr>
          </thead>
          <tbody>
            ${profissionais.map(p => {
              const doc = escalasPorProf[p.id] || { dias:{} };
              const horas = calcularHorasProfissional(doc.dias, ESTADO.cacheHoras);
              return `<tr data-prof="${p.id}">
                <td class="nome-prof">${escapeHtml(p.nome)}</td>
                ${Array.from({length:totalDias},(_,i)=>{
                  const d=i+1; const cod = doc.dias[d] || "";
                  const dsem=diaDaSemana(ano,mes,d); const fds = dsem===0||dsem===6;
                  return `<td class="dia ${fds?'fds':''} ${cod?'codigo-'+cod:''}" data-dia="${d}" title="${NOME_CODIGO[cod]||''}">${cod}</td>`;
                }).join("")}
                <td class="total-linha">${(horas/12).toFixed(2).replace(/\.00$/,"")}</td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>
      <div class="legenda-codigos">
        ${codigos.map(c => `<span class="codigo-${c}">${c} — ${NOME_CODIGO[c]}</span>`).join("")}
      </div>
    </div>`;

  document.getElementById("selMes").addEventListener("change", e => { ESTADO.escalaAtual.mes = +e.target.value; renderEscala(setor); });
  document.getElementById("selAno").addEventListener("change", e => { ESTADO.escalaAtual.ano = +e.target.value; renderEscala(setor); });
  document.getElementById("btnImprimirEscala").addEventListener("click", () => window.print());

  if (podeEditar) {
    vp.querySelectorAll("td.dia").forEach(td => td.addEventListener("click", async () => {
      const tr = td.closest("tr");
      const profId = tr.dataset.prof;
      const dia = td.dataset.dia;
      const atual = td.textContent.trim();
      const opcoes = ["", ...codigos];
      const prox = opcoes[(opcoes.indexOf(atual)+1) % opcoes.length];
      td.textContent = prox;
      td.className = "dia" + (prox ? " codigo-"+prox : "");
      td.title = NOME_CODIGO[prox] || "";
      await salvarCelulaEscala(setor, ano, mes, profId, dia, prox);
      // recalcula total da linha
      const dias = {}; tr.querySelectorAll("td.dia").forEach(c => { if (c.textContent.trim()) dias[c.dataset.dia] = c.textContent.trim(); });
      const horas = calcularHorasProfissional(dias, ESTADO.cacheHoras);
      tr.querySelector(".total-linha").textContent = (horas/12).toFixed(2).replace(/\.00$/,"");
    }));
  }
}

function calcularHorasProfissional(diasObj, tabelaHoras) {
  let total = 0;
  Object.values(diasObj || {}).forEach(cod => { total += (tabelaHoras[cod] || 0); });
  return total;
}

async function salvarCelulaEscala(setor, ano, mes, profissionalId, dia, codigo) {
  const docId = `${setor}_${ano}_${mes}_${profissionalId}`;
  const ref = db.collection("escalas").doc(docId);
  const campo = `dias.${dia}`;
  if (codigo) {
    await ref.set({ setor, ano, mes, profissionalId, [`dias`]: {} }, { merge:true }).catch(()=>{});
    await ref.set({ [campo]: codigo }, { merge:true });
  } else {
    await ref.set({ setor, ano, mes, profissionalId }, { merge:true });
    await ref.update({ [campo]: firebase.firestore.FieldValue.delete() }).catch(()=>{});
  }
}

// -------------------------------------------------------------------------
// 7. DASHBOARD
// -------------------------------------------------------------------------
let graficosAtivos = [];
function destruirGraficos() { graficosAtivos.forEach(g => g.destroy()); graficosAtivos = []; }

async function renderDashboard() {
  const vp = document.getElementById("viewport");
  vp.innerHTML = `<div class="cartao">Carregando painel...</div>`;
  const hoje = new Date();
  const mes = hoje.getMonth()+1, ano = hoje.getFullYear();

  const profissionais = await carregarProfissionais();
  const snap = await db.collection("escalas").where("setor","==","plantoes").where("ano","==",ano).where("mes","==",mes).get();
  const escalas = snap.docs.map(d => d.data());

  let totalHoras = 0, totalPlantoes12h = 0;
  const porProfissional = {};
  const porCodigo = {};
  escalas.forEach(doc => {
    const nome = (profissionais.find(p=>p.id===doc.profissionalId)||{}).nome || "?";
    Object.values(doc.dias || {}).forEach(cod => {
      const h = ESTADO.cacheHoras[cod] || 0;
      totalHoras += h;
      porProfissional[nome] = (porProfissional[nome]||0) + h;
      porCodigo[cod] = (porCodigo[cod]||0) + 1;
    });
  });
  totalPlantoes12h = totalHoras/12;
  const valorEstimado = totalPlantoes12h * (ESTADO.cacheValores.valorPlantao12h || 950);

  vp.innerHTML = `
    <div class="cabecalho-pagina"><div><h2>Painel Geral</h2><div class="desc">Resumo de ${MESES[mes-1]} de ${ano} — Setor: Plantões Médicos</div></div></div>
    <div class="grade-cartoes">
      <div class="kpi"><div class="valor">${profissionais.filter(p=>p.ativo!==false).length}</div><div class="rotulo">Profissionais ativos</div></div>
      <div class="kpi k-verde"><div class="valor">${totalPlantoes12h.toFixed(1)}</div><div class="rotulo">Plantões (equiv. 12h) no mês</div></div>
      <div class="kpi k-amarelo"><div class="valor">${totalHoras.toFixed(0)}h</div><div class="rotulo">Total de horas no mês</div></div>
      <div class="kpi k-vermelho"><div class="valor">${fmtMoeda(valorEstimado)}</div><div class="rotulo">Valor estimado a pagar</div></div>
    </div>
    <div class="grafico-grid">
      <div class="cartao"><h3>Plantões (horas) por profissional</h3><canvas id="graf1"></canvas></div>
      <div class="cartao"><h3>Distribuição por tipo de código</h3><canvas id="graf2"></canvas></div>
    </div>
    <div class="cartao"><h3>Evolução de horas — últimos 6 meses</h3><canvas id="graf3" style="max-height:260px"></canvas></div>`;

  destruirGraficos();
  const nomesProf = Object.keys(porProfissional);
  graficosAtivos.push(new Chart(document.getElementById("graf1"), {
    type: "bar",
    data: { labels: nomesProf, datasets: [{ label:"Horas", data: nomesProf.map(n=>porProfissional[n]), backgroundColor:"#0b5394" }] },
    options: { responsive:true, plugins:{legend:{display:false}} }
  }));
  graficosAtivos.push(new Chart(document.getElementById("graf2"), {
    type: "doughnut",
    data: { labels: Object.keys(porCodigo).map(c=>`${c} - ${NOME_CODIGO[c]||c}`), datasets:[{ data:Object.values(porCodigo), backgroundColor:["#2c3e70","#ffb703","#fb8500","#8ecae6","#c0392b","#9d4edd","#219ebc","#adb5bd"] }] },
    options: { responsive:true }
  }));

  // últimos 6 meses
  const meses6 = [];
  for (let i=5;i>=0;i--) { const d = new Date(ano, mes-1-i, 1); meses6.push({ mes:d.getMonth()+1, ano:d.getFullYear(), label:`${MESES[d.getMonth()].slice(0,3)}/${d.getFullYear()}` }); }
  const totaisMensais = [];
  for (const m of meses6) {
    const s = await db.collection("escalas").where("setor","==","plantoes").where("ano","==",m.ano).where("mes","==",m.mes).get();
    let h = 0; s.docs.forEach(d => Object.values(d.data().dias||{}).forEach(c => h += (ESTADO.cacheHoras[c]||0)));
    totaisMensais.push(h);
  }
  graficosAtivos.push(new Chart(document.getElementById("graf3"), {
    type: "line",
    data: { labels: meses6.map(m=>m.label), datasets:[{ label:"Horas totais", data: totaisMensais, borderColor:"#1e8e5a", backgroundColor:"rgba(30,142,90,.15)", fill:true, tension:.3 }] },
    options: { responsive:true }
  }));
}

// -------------------------------------------------------------------------
// 8. RELATÓRIOS / FECHAMENTO
// -------------------------------------------------------------------------
async function renderRelatorios() {
  const vp = document.getElementById("viewport");
  const hoje = new Date();
  const mes = ESTADO.escalaAtual.mes || hoje.getMonth()+1;
  const ano = ESTADO.escalaAtual.ano || hoje.getFullYear();
  const anosOpcoes = []; for (let a = hoje.getFullYear()-1; a <= hoje.getFullYear()+1; a++) anosOpcoes.push(a);

  vp.innerHTML = `
    <div class="cabecalho-pagina"><div><h2>Relatório de Fechamento</h2><div class="desc">Cálculo automático de plantões e valores a pagar por profissional</div></div></div>
    <div class="barra-ferramentas">
      <select id="rMes">${MESES.map((m,i)=>`<option value="${i+1}" ${i+1===mes?"selected":""}>${m}</option>`).join("")}</select>
      <select id="rAno">${anosOpcoes.map(a=>`<option value="${a}" ${a===ano?"selected":""}>${a}</option>`).join("")}</select>
      <button class="btn btn-secundario" id="btnGerar">Gerar relatório</button>
      <button class="btn btn-primario" id="btnImprimirRel">🖨️ Imprimir / PDF</button>
    </div>
    <div id="areaRelatorio" class="cartao">Selecione o período e clique em "Gerar relatório".</div>`;

  document.getElementById("btnImprimirRel").addEventListener("click", () => window.print());
  document.getElementById("btnGerar").addEventListener("click", () => gerarRelatorio(+document.getElementById("rMes").value, +document.getElementById("rAno").value));
  gerarRelatorio(mes, ano);
}

async function gerarRelatorio(mes, ano) {
  ESTADO.escalaAtual.mes = mes; ESTADO.escalaAtual.ano = ano;
  const area = document.getElementById("areaRelatorio");
  area.innerHTML = "Calculando...";
  const profissionais = (await carregarProfissionais());
  const setoresChave = ["plantoes","transferencias","visitas"];
  const dadosPorSetor = {};
  for (const s of setoresChave) {
    const snap = await db.collection("escalas").where("setor","==",s).where("ano","==",ano).where("mes","==",mes).get();
    dadosPorSetor[s] = {};
    snap.docs.forEach(d => { dadosPorSetor[s][d.data().profissionalId] = d.data().dias || {}; });
  }

  const linhas = profissionais.map(p => {
    const horasPlantao = calcularHorasProfissional(dadosPorSetor.plantoes[p.id]||{}, ESTADO.cacheHoras);
    const horasTransf  = calcularHorasProfissional(dadosPorSetor.transferencias[p.id]||{}, ESTADO.cacheHoras);
    const diasVisita    = Object.values(dadosPorSetor.visitas[p.id]||{}).filter(c=>c==="V").length;

    const un12hPlantao = horasPlantao/12;
    const un12hTransf  = horasTransf/12;
    const valor = un12hPlantao*(ESTADO.cacheValores.valorPlantao12h||950)
                + un12hTransf*(ESTADO.cacheValores.valorTransf12h||330)
                + diasVisita*(ESTADO.cacheValores.valorVisitaDia||233.33);
    return { p, un12hPlantao, un12hTransf, diasVisita, valor };
  }).filter(l => l.valor > 0 || l.un12hPlantao>0 || l.un12hTransf>0 || l.diasVisita>0);

  const totalGeral = linhas.reduce((s,l)=>s+l.valor,0);

  area.innerHTML = `
    <div style="text-align:center;margin-bottom:14px">
      <h3 style="margin:0">SECRETARIA MUNICIPAL DE SAÚDE DE JABORANDI</h3>
      <div>Fechamento — ${MESES[mes-1]} de ${ano}</div>
    </div>
    <table class="tabela">
      <thead><tr>
        <th>Profissional</th><th>CPF/CNPJ</th><th>Emite N.F.</th>
        <th>Plantões 12h</th><th>Transf. 12h</th><th>Visitas (dias)</th><th>Total a Pagar</th>
      </tr></thead>
      <tbody>
        ${linhas.map(l => `<tr>
          <td>${escapeHtml(l.p.nome)}</td>
          <td>${escapeHtml(l.p.cpf||"-")}</td>
          <td>${l.p.emiteNF?"SIM":"NÃO"}</td>
          <td>${l.un12hPlantao.toFixed(2).replace(/\.00$/,"")}</td>
          <td>${l.un12hTransf.toFixed(2).replace(/\.00$/,"")}</td>
          <td>${l.diasVisita}</td>
          <td>${fmtMoeda(l.valor)}</td>
        </tr>`).join("")}
      </tbody>
      <tfoot><tr><td colspan="6" style="text-align:right;font-weight:700">TOTAL GERAL</td><td style="font-weight:700">${fmtMoeda(totalGeral)}</td></tr></tfoot>
    </table>
    <p style="font-size:.75rem;color:#6b7280;margin-top:10px">
      Fórmula: (horas de plantão ÷ 12) × ${fmtMoeda(ESTADO.cacheValores.valorPlantao12h||950)} + (horas de transferência ÷ 12) × ${fmtMoeda(ESTADO.cacheValores.valorTransf12h||330)} + (dias de visita × ${fmtMoeda(ESTADO.cacheValores.valorVisitaDia||233.33)}).
      Valores e pesos por código são ajustáveis em Configurações.
    </p>`;
}

// -------------------------------------------------------------------------
// 9. USUÁRIOS E PERFIS (somente administrador)
// -------------------------------------------------------------------------
async function renderUsuarios() {
  const vp = document.getElementById("viewport");
  vp.innerHTML = `<div class="cartao">Carregando...</div>`;
  const snap = await db.collection("usuarios").get();
  const usuarios = snap.docs.map(d => ({ id:d.id, ...d.data() }));

  vp.innerHTML = `
    <div class="cabecalho-pagina"><div><h2>Usuários e Perfis de Acesso</h2><div class="desc">Aprove novos cadastros e defina o perfil de cada pessoa.</div></div></div>
    <div class="cartao" style="overflow:auto">
      <table class="tabela">
        <thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${usuarios.map(u => `
            <tr data-uid="${u.id}">
              <td>${escapeHtml(u.nome)}</td>
              <td>${escapeHtml(u.email)}</td>
              <td>
                <select class="selPerfil">
                  ${Object.keys(PERFIS).filter(k=>k!=="pendente").map(k=>`<option value="${k}" ${u.perfil===k?"selected":""}>${PERFIS[k].label}</option>`).join("")}
                </select>
              </td>
              <td><span class="badge ${u.ativo?"badge-verde":"badge-vermelho"}">${u.ativo?"Ativo":"Pendente/Bloqueado"}</span></td>
              <td>
                <button class="btn btn-sucesso salvarUsuario" style="padding:6px 10px">Salvar</button>
                ${u.ativo ? `<button class="btn btn-perigo bloquearUsuario" style="padding:6px 10px">Bloquear</button>` : ""}
              </td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>
    <p style="font-size:.8rem;color:#6b7280">Novas contas são criadas pela própria pessoa na tela de login ("Criar acesso"). Aqui você define o perfil e ativa o acesso.</p>`;

  vp.querySelectorAll("tr[data-uid]").forEach(tr => {
    tr.querySelector(".salvarUsuario").addEventListener("click", async () => {
      const perfil = tr.querySelector(".selPerfil").value;
      await db.collection("usuarios").doc(tr.dataset.uid).update({ perfil, ativo:true });
      renderUsuarios();
    });
    tr.querySelector(".bloquearUsuario")?.addEventListener("click", async () => {
      if (!confirm("Bloquear o acesso desta pessoa?")) return;
      await db.collection("usuarios").doc(tr.dataset.uid).update({ ativo:false });
      renderUsuarios();
    });
  });
}

// -------------------------------------------------------------------------
// 10. CONFIGURAÇÕES (valores de pagamento e conversão de horas)
// -------------------------------------------------------------------------
async function renderConfiguracoes() {
  const vp = document.getElementById("viewport");
  const v = ESTADO.cacheValores, h = ESTADO.cacheHoras;
  vp.innerHTML = `
    <div class="cabecalho-pagina"><div><h2>Configurações</h2><div class="desc">Valores de pagamento e conversão de códigos em horas.</div></div></div>
    <div class="cartao">
      <h3>Valores de pagamento (R$)</h3>
      <div class="campos-2">
        <div class="campo"><label>Plantão de 12h (por unidade)</label><input type="number" step="0.01" id="vPlantao" value="${v.valorPlantao12h}"></div>
        <div class="campo"><label>Transferência (por unidade 12h)</label><input type="number" step="0.01" id="vTransf" value="${v.valorTransf12h}"></div>
        <div class="campo"><label>Visita médica (por dia)</label><input type="number" step="0.01" id="vVisita" value="${v.valorVisitaDia}"></div>
        <div class="campo"><label>Responsável pela escala (mensal)</label><input type="number" step="0.01" id="vResponsavel" value="${v.responsavelEscala}"></div>
      </div>
    </div>
    <div class="cartao">
      <h3>Conversão de código → horas</h3>
      <div class="campos-2">
        ${["M","T","D","N","6","18","24"].map(c => `<div class="campo"><label>Código "${c}" (${NOME_CODIGO[c]})</label><input type="number" step="0.5" id="h_${c}" value="${h[c]}"></div>`).join("")}
      </div>
    </div>
    <button class="btn btn-primario" id="btnSalvarConfig">Salvar configurações</button>`;

  document.getElementById("btnSalvarConfig").addEventListener("click", async () => {
    const novosValores = {
      valorPlantao12h: +document.getElementById("vPlantao").value,
      valorTransf12h: +document.getElementById("vTransf").value,
      valorVisitaDia: +document.getElementById("vVisita").value,
      responsavelEscala: +document.getElementById("vResponsavel").value,
    };
    const novasHoras = { F:0, V:0 };
    ["M","T","D","N","6","18","24"].forEach(c => novasHoras[c] = +document.getElementById(`h_${c}`).value);
    await db.collection("configuracoes").doc("valores").set(novosValores);
    await db.collection("configuracoes").doc("horas").set(novasHoras);
    ESTADO.cacheValores = novosValores; ESTADO.cacheHoras = novasHoras;
    alert("Configurações salvas!");
  });
}
