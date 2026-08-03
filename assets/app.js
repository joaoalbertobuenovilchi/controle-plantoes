/* =========================================================================
   SISTEMA DE CONTROLE DE PLANTÕES MÉDICOS - JABORANDI/SP
   Lógica principal (JavaScript puro + Firebase)
   ========================================================================= */

// -------------------------------------------------------------------------
// 0. CONSTANTES E DADOS INICIAIS
// -------------------------------------------------------------------------
const CATEGORIAS_PROFISSIONAL = ["Médico", "Enfermeiro", "Técnico de Enfermagem", "Coordenador", "Outro"];

const PALETA_CORES = ["#2c3e70","#ffb703","#fb8500","#8ecae6","#c0392b","#9d4edd","#219ebc","#1e8e5a","#e07a5f","#6d6875","#f4a261","#457b9d"];

// Tipos de escala padrão (equivalentes às abas da planilha original). O usuário pode
// criar quantos outros quiser em "Tipos de Escala" (ex.: Escala - Enfermagem, Escala - Técnicos).
const TIPOS_ESCALA_PADRAO = [
  { id: "plantoes", nome: "Plantões Médicos", codigos: [
      { codigo:"N", nome:"Noite",    horas:12, inicio:"19:00", cor:"#2c3e70" },
      { codigo:"D", nome:"Dia",      horas:12, inicio:"07:00", cor:"#ffd166" },
      { codigo:"T", nome:"Tarde",    horas:12, inicio:"13:00", cor:"#fb8500" },
      { codigo:"M", nome:"Manhã",    horas:6,  inicio:"07:00", cor:"#8ecae6" },
      { codigo:"24",nome:"24 Horas", horas:24, inicio:"07:00", cor:"#c0392b" },
      { codigo:"18",nome:"18 Horas", horas:18, inicio:"07:00", cor:"#9d4edd" },
      { codigo:"6", nome:"06 Horas", horas:6,  inicio:"07:00", cor:"#219ebc" },
      { codigo:"F", nome:"Férias",   horas:0,  inicio:"00:00", cor:"#b0b0b0" },
  ]},
  { id: "transferencias", nome: "Transferências Médicas", codigos: [
      { codigo:"N", nome:"Noite",    horas:12, inicio:"19:00", cor:"#2c3e70" },
      { codigo:"D", nome:"Dia",      horas:12, inicio:"07:00", cor:"#ffd166" },
      { codigo:"T", nome:"Tarde",    horas:12, inicio:"13:00", cor:"#fb8500" },
      { codigo:"M", nome:"Manhã",    horas:6,  inicio:"07:00", cor:"#8ecae6" },
      { codigo:"24",nome:"24 Horas", horas:24, inicio:"07:00", cor:"#c0392b" },
      { codigo:"18",nome:"18 Horas", horas:18, inicio:"07:00", cor:"#9d4edd" },
      { codigo:"6", nome:"06 Horas", horas:6,  inicio:"07:00", cor:"#219ebc" },
      { codigo:"F", nome:"Férias",   horas:0,  inicio:"00:00", cor:"#b0b0b0" },
  ]},
  { id: "visitas", nome: "Visitas Médicas / Internações", codigos: [
      { codigo:"V", nome:"Visita",  horas:24, inicio:"07:00", cor:"#0b8f8f" },
      { codigo:"F", nome:"Férias",  horas:0,  inicio:"00:00", cor:"#b0b0b0" },
  ]},
];

// Valores de plantão padrão (equivalentes aos valores da planilha original, convertidos para R$/hora)
const VALORES_PADRAO = [
  { descricao:"Plantão Médico (padrão)",        setorId:"plantoes",       categoria:"Todos", valorHora: 79.17 },
  { descricao:"Transferência Médica (padrão)",  setorId:"transferencias", categoria:"Todos", valorHora: 27.50 },
  { descricao:"Visita Médica (padrão, por dia)",setorId:"visitas",        categoria:"Todos", valorHora: 9.72 },
];

// Telas do sistema que podem ter permissão configurada por perfil.
// "escalas" cobre todos os tipos de escala (Plantões, Enfermagem, o que for criado).
const TELAS_PERMISSAO = [
  { id:"dashboard",       label:"Painel Geral" },
  { id:"escalas",         label:"Escalas (todos os tipos)" },
  { id:"profissionais",   label:"Cadastro de Profissionais" },
  { id:"entidades",       label:"Cadastro de Entidades" },
  { id:"relatorios",      label:"Relatórios" },
  { id:"fechamento",      label:"Fechamento" },
  { id:"tipos-escala",    label:"Tipos de Escala" },
  { id:"valores-plantao", label:"Valores de Plantões" },
  { id:"competencias",    label:"Competências" },
  { id:"trocas",          label:"Trocas de Plantão" },
  { id:"usuarios",        label:"Usuários e Perfis" },
];
const NIVEIS_PERMISSAO = { nenhum:"Sem acesso", ver:"Visualizar", editar:"Editar" };

// Perfis padrão (semeados na primeira vez; o Administrador pode criar/editar/excluir outros depois)
const PERFIS_PADRAO = [
  { id:"administrador", nome:"Administrador", cor:"#c0392b", protegido:true,
    permissoes: Object.fromEntries(TELAS_PERMISSAO.map(t=>[t.id,"editar"])) },
  { id:"diretor_clinico", nome:"Diretor(a) Clínico(a)", cor:"#7b2cbf", protegido:false,
    permissoes: { dashboard:"ver", escalas:"ver", profissionais:"ver", entidades:"ver", relatorios:"ver", fechamento:"ver", "tipos-escala":"nenhum", "valores-plantao":"nenhum", competencias:"nenhum", trocas:"editar", usuarios:"nenhum" } },
  { id:"coordenador", nome:"Coordenador de Escalas", cor:"#0b5394", protegido:false,
    permissoes: { dashboard:"ver", escalas:"editar", profissionais:"editar", entidades:"ver", relatorios:"ver", fechamento:"ver", "tipos-escala":"editar", "valores-plantao":"nenhum", competencias:"editar", trocas:"ver", usuarios:"nenhum" } },
  { id:"medico", nome:"Médico(a)", cor:"#1e8e5a", protegido:false,
    permissoes: { dashboard:"ver", escalas:"ver", profissionais:"ver", entidades:"nenhum", relatorios:"ver", fechamento:"nenhum", "tipos-escala":"nenhum", "valores-plantao":"nenhum", competencias:"nenhum", trocas:"ver", usuarios:"nenhum" } },
  { id:"enfermeiro", nome:"Enfermeiro(a)", cor:"#1e8e5a", protegido:false,
    permissoes: { dashboard:"ver", escalas:"ver", profissionais:"ver", entidades:"nenhum", relatorios:"ver", fechamento:"nenhum", "tipos-escala":"nenhum", "valores-plantao":"nenhum", competencias:"nenhum", trocas:"ver", usuarios:"nenhum" } },
  { id:"tecnico_enfermagem", nome:"Técnico(a) de Enfermagem", cor:"#6b7280", protegido:false,
    permissoes: { dashboard:"ver", escalas:"ver", profissionais:"nenhum", entidades:"nenhum", relatorios:"nenhum", fechamento:"nenhum", "tipos-escala":"nenhum", "valores-plantao":"nenhum", competencias:"nenhum", trocas:"ver", usuarios:"nenhum" } },
];

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DIAS_SEMANA = ["dom","seg","ter","qua","qui","sex","sáb"];

const PROFISSIONAIS_INICIAIS = [{"id": "4", "nome": "ALEXANDRE PONTES GERONYMO", "crm": "167420", "cpf": "22173921827", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "11986583937", "emiteNF": false, "ativo": true}, {"id": "5", "nome": "ANA LAURA JUNQUEIRA DE SOUZA", "crm": "249561", "cpf": "43692166800", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "53188821000160", "emiteNF": false, "ativo": true}, {"id": "6", "nome": "ANA PAULA MACEDO DE PAULA", "crm": "264529", "cpf": "5655667177", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "5655667177", "emiteNF": false, "ativo": true}, {"id": "22", "nome": "ANDRE SILVEIRA FONSECA", "crm": "155487", "cpf": "1640304177", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "1640304177", "emiteNF": false, "ativo": true}, {"id": "23", "nome": "ANGELA NATALIA GONÇALVES RABELO", "crm": "269678", "cpf": "3807318275", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "3807318275", "emiteNF": false, "ativo": true}, {"id": "24", "nome": "ANTONIO HENRIQUE R. B. DA SILVA", "crm": "182600", "cpf": "34140935880", "agencia": "1977", "nomeAgencia": "SANTANDER", "conta": "01000137-2", "pix": "26789589000142", "emiteNF": true, "ativo": true}, {"id": "25", "nome": "ARTHUR ANTONIO CANTISANO", "crm": "274045", "cpf": "41493104837", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "41493104837", "emiteNF": false, "ativo": true}, {"id": "26", "nome": "BEATRIZ CHIOZZINI PORTO", "crm": "252841", "cpf": "14997052079", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "14997052079", "emiteNF": false, "ativo": true}, {"id": "27", "nome": "BIANCA RIBESSI TEIXEIRA", "crm": "239077", "cpf": "41533401896", "agencia": "1739", "nomeAgencia": "BRADESCO", "conta": "0012228-9", "pix": "19999663987", "emiteNF": false, "ativo": true}, {"id": "28", "nome": "BRUNO DENARDI LEMOS", "crm": "238746", "cpf": "40982479840", "agencia": "3188", "nomeAgencia": "", "conta": "547611", "pix": "40982479840", "emiteNF": false, "ativo": true}, {"id": "29", "nome": "DANIEL APARECIDO DOS SANTOS", "crm": "188127", "cpf": "7672477609", "agencia": "3619", "nomeAgencia": "BRADESCO", "conta": "350029-2", "pix": "danieldossantosmed@gmail.com", "emiteNF": false, "ativo": true}, {"id": "30", "nome": "DIANA GOMES BASILIO", "crm": "233706", "cpf": "41093753803", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "41093753803", "emiteNF": false, "ativo": true}, {"id": "31", "nome": "DIEGO SARMIENTO BRUNO", "crm": "261973", "cpf": "32244168841", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "32244168841", "emiteNF": false, "ativo": true}, {"id": "32", "nome": "EMILIO PEREIRA DE SOUSA", "crm": "254042", "cpf": "43978794861", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "537978610001053", "emiteNF": true, "ativo": true}, {"id": "33", "nome": "FILIPE SILVA COSTA", "crm": "249670", "cpf": "13561862624", "agencia": "0502-9", "nomeAgencia": "BANCO DO BRASIL", "conta": "26667-1", "pix": "13561862624", "emiteNF": false, "ativo": true}, {"id": "34", "nome": "GABRIELA COLEHO GIAQUETO", "crm": "252849", "cpf": "44551699896", "agencia": "0001", "nomeAgencia": "INTER", "conta": "33006686-2", "pix": "dragabrielagiaqueto@outlook.com", "emiteNF": false, "ativo": true}, {"id": "35", "nome": "GIOVANA ALMEIDA F. ALONSO", "crm": "239151", "cpf": "31473729874", "agencia": "1", "nomeAgencia": "INTER", "conta": "3472876-7", "pix": "15981244334", "emiteNF": false, "ativo": true}, {"id": "36", "nome": "GUILHERME HENRIQUE PUPIM GARCIA", "crm": "238824", "cpf": "38773251810", "agencia": "0001", "nomeAgencia": "INTER", "conta": "26559583-5", "pix": "48951722000158", "emiteNF": false, "ativo": true}, {"id": "37", "nome": "GUSTAVO BELFORT TEIXEIRA", "crm": "238830", "cpf": "49917685863", "agencia": "3146", "nomeAgencia": "ITAU", "conta": "465756", "pix": "3500536000164", "emiteNF": false, "ativo": true}, {"id": "38", "nome": "ISRAEL DE SOUZA MARQUES", "crm": "245275", "cpf": "33275156896", "agencia": "1989", "nomeAgencia": "SANTANDER", "conta": "01001172-3", "pix": "33275156896", "emiteNF": false, "ativo": true}, {"id": "39", "nome": "ITALO GABRIEL BELTRAMEVAZZOLER", "crm": "246844", "cpf": "44695282852", "agencia": "0001", "nomeAgencia": "NUBANK", "conta": "96587119-1", "pix": "44695282852", "emiteNF": false, "ativo": true}, {"id": "40", "nome": "JOAO VICTOR TOGO CAMILO", "crm": "252188", "cpf": "47652441803", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "53313108000109", "emiteNF": true, "ativo": true}, {"id": "41", "nome": "JULIA RODRIGUES DE ALMEIDA", "crm": "245079", "cpf": "44385910820", "agencia": "2461-9", "nomeAgencia": "", "conta": "108248-5", "pix": "16993252651", "emiteNF": false, "ativo": true}, {"id": "42", "nome": "JULIANA DE OLIVEIRA LANNES", "crm": "216321", "cpf": "30166461881", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "301.664.618-81", "emiteNF": false, "ativo": true}, {"id": "43", "nome": "KAMILLE ANIK CALVO", "crm": "238874", "cpf": "45645860845", "agencia": "8649", "nomeAgencia": "ITAU", "conta": "04650-18'", "pix": "45645860845", "emiteNF": false, "ativo": true}, {"id": "44", "nome": "LAISA RODRIGUES", "crm": "216512", "cpf": "39990577854", "agencia": "0024", "nomeAgencia": "SANTANDER", "conta": "01031426-5", "pix": "39990577854", "emiteNF": false, "ativo": true}, {"id": "45", "nome": "LARISSA ROSA FERNANDES", "crm": "241466", "cpf": "35401434839", "agencia": "0715", "nomeAgencia": "", "conta": "71701-9", "pix": "fernandes99lari@gmail.com", "emiteNF": false, "ativo": true}, {"id": "46", "nome": "LEANDRO FRANCISCHINI DIBI", "crm": "129536", "cpf": "31506837859", "agencia": "0504", "nomeAgencia": "SANTANDER", "conta": "01003807-8", "pix": "17991863870", "emiteNF": false, "ativo": true}, {"id": "47", "nome": "LIVIA BORGES DE SOUZA", "crm": "91541", "cpf": "10373605676", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "1640304177", "emiteNF": false, "ativo": true}, {"id": "48", "nome": "LORENA CHABOLI DOS SANTOS", "crm": "252859", "cpf": "46766872810", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "44003681000117", "emiteNF": true, "ativo": true}, {"id": "49", "nome": "LUIZ FERNANDO DE CARVALHO SCAGLIONE", "crm": "217769", "cpf": "36991398837", "agencia": "3188", "nomeAgencia": "SICOOB 756", "conta": "119663-4", "pix": "36991398837", "emiteNF": false, "ativo": true}, {"id": "50", "nome": "LUIZA DOURADO SILVA MUNIZ", "crm": "227143", "cpf": "2305191138", "agencia": "0001", "nomeAgencia": "C6 S.A.", "conta": "4690352-6", "pix": "2305191138", "emiteNF": false, "ativo": true}, {"id": "51", "nome": "MARCELO CAUSIN BENEDETI", "crm": "238491", "cpf": "45524470841", "agencia": "0001", "nomeAgencia": "C6 S.A.", "conta": "22850825-8", "pix": "48730982000101", "emiteNF": false, "ativo": true}, {"id": "52", "nome": "MARIA EDUARDA COSTA S. RIBEIRO", "crm": "210880", "cpf": "9928412677", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "duda.sribeiro@hotmail.com", "emiteNF": false, "ativo": true}, {"id": "53", "nome": "MARIA EDUARDA GARCIA PALHARINI", "crm": "251329", "cpf": "42745639870", "agencia": "3188", "nomeAgencia": "SICOOB CREDICITRUS", "conta": "103196-1", "pix": "42745639870", "emiteNF": false, "ativo": true}, {"id": "54", "nome": "MARIA EDUARDA ROVARIS", "crm": "253607", "cpf": "45193905838", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "45193905838", "emiteNF": false, "ativo": true}, {"id": "55", "nome": "MARIA LUIZA SUED ANDRADE", "crm": "272414", "cpf": "12183242795", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "mrsued11@gmail.com", "emiteNF": false, "ativo": true}, {"id": "56", "nome": "MARIA THEREZA SANTOS CIRINO", "crm": "252861", "cpf": "47238653818", "agencia": "0001", "nomeAgencia": "NU PAGAMENTOS S.A.", "conta": "55329362-8", "pix": "17992459796", "emiteNF": false, "ativo": true}, {"id": "57", "nome": "MONIQUE ROSSATO DA CUNHA", "crm": "246027", "cpf": "43608037888", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "43608037888", "emiteNF": false, "ativo": true}, {"id": "58", "nome": "OTAVIO PEREIRA DE SOUSA", "crm": "254069", "cpf": "45779851875", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "otaviosev99@gmail.com", "emiteNF": false, "ativo": true}, {"id": "59", "nome": "PEDRO HENRIQUE OLIVEIRA M. ARAUJO", "crm": "238968", "cpf": "43768643824", "agencia": "0001", "nomeAgencia": "NU PAGAMENTOS S.A.", "conta": "99332911-8", "pix": "17991016969", "emiteNF": false, "ativo": true}, {"id": "60", "nome": "PEDRO ROSA", "crm": "224594", "cpf": "38327122835", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "38327122835", "emiteNF": false, "ativo": true}, {"id": "61", "nome": "SALUA OLIVARI NASSBINE FERREIRA", "crm": "134300", "cpf": "28294295807", "agencia": "3214", "nomeAgencia": "SICOOB COCRED", "conta": "41357-7", "pix": "17991353261", "emiteNF": false, "ativo": true}, {"id": "62", "nome": "SIMONE PATRICIA MASARI", "crm": "334049", "cpf": "37701962875", "agencia": "0367", "nomeAgencia": "SANTANDER", "conta": "01003291-0", "pix": "37701962875", "emiteNF": false, "ativo": true}, {"id": "63", "nome": "SUHAYLA NASSBINE S. MEDEIROS", "crm": "169388", "cpf": "38812802869", "agencia": "3214", "nomeAgencia": "SICOOB", "conta": "36369-3", "pix": "28697909880", "emiteNF": false, "ativo": true}, {"id": "64", "nome": "VANISSA OLIVARI NASSBINE SILVA", "crm": "107459", "cpf": "18333830770", "agencia": "", "nomeAgencia": "BRADESCO NET EMPRESA", "conta": "10344-6", "pix": "dravanissanassbine@gmail.com", "emiteNF": false, "ativo": true}, {"id": "65", "nome": "VICTORIA DEL MORO CESPEDES", "crm": "252866", "cpf": "11438783612", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "11438783612", "emiteNF": false, "ativo": true}, {"id": "66", "nome": "WASHINGTON LUIZ DOS SANTOS", "crm": "64973", "cpf": "49609203604", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "NÃO POSSUI", "emiteNF": false, "ativo": true}, {"id": "67", "nome": "YURI PEIXOTO TELLES", "crm": "250018", "cpf": "44379065863", "agencia": "", "nomeAgencia": "NUBANK", "conta": "5339707-7", "pix": "44379065863", "emiteNF": false, "ativo": true}, {"id": "68", "nome": "MARCELO ALEXANDRE G. JUNIOR", "crm": "264906", "cpf": "47042118863", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "47042118863", "emiteNF": false, "ativo": true}, {"id": "69", "nome": "YASMIN MEDEIROS GUIMARAES", "crm": "265102", "cpf": "40501761810", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "58098029000138", "emiteNF": false, "ativo": true}, {"id": "70", "nome": "DECIO BORGES DA COSTA NETO", "crm": "112806", "cpf": "9928410623", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "34992410637", "emiteNF": false, "ativo": true}, {"id": "71", "nome": "LAIS WORLICZEK DE CAMARGO", "crm": "264829", "cpf": "401.182.738-09", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "lais.camargo1@hotmail.com", "emiteNF": false, "ativo": true}, {"id": "72", "nome": "ANA CLARA JUNQUEIRA TEDESCHI", "crm": "281953", "cpf": "387.363.638-71", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "387.363.638-71", "emiteNF": false, "ativo": true}, {"id": "73", "nome": "LARISSA CAMPAGNON DA SILVA", "crm": "282331", "cpf": "33931667863", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "33931667863", "emiteNF": false, "ativo": true}, {"id": "74", "nome": "LARA RIBEIRO DE OLIVEIRA", "crm": "282327", "cpf": "488.162.628-00", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "48816262800", "emiteNF": false, "ativo": true}, {"id": "75", "nome": "ANA LAURA GARCIA DE MENEZES", "crm": "282877", "cpf": "438.078.918-70", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "438.078.918-70", "emiteNF": false, "ativo": true}, {"id": "76", "nome": "ISAQUE PEIXOTO RIBEIRO", "crm": "283183", "cpf": "441.086.418-17", "agencia": "", "nomeAgencia": "", "conta": "", "pix": "64643529000106", "emiteNF": true, "ativo": true}];

// -------------------------------------------------------------------------
// 1. ESTADO GLOBAL
// -------------------------------------------------------------------------
let ESTADO = {
  usuario: null,
  usuarioDoc: null,
  telaAtual: "dashboard",
  cacheProfissionais: [],
  cacheEntidades: [],
  cacheTiposEscala: [],
  cacheValoresPlantao: [],
  cachePerfis: [],
  cacheCompetenciasFechadas: {},   // { "2026-3": {...} }
  escalaAtual: { setorId: "plantoes", mes: new Date().getMonth()+1, ano: new Date().getFullYear() },
  ultimoRelatorio: null,           // { titulo, colunas:[], linhas:[[...]] } - usado para exportar
};

const $app = document.getElementById("app");

// Link mágico de confirmação de troca de plantão (clicado direto do e-mail, sem precisar logar)
const PARAMS_URL = new URLSearchParams(location.search);
const LINK_TROCA = PARAMS_URL.get("troca")
  ? { id: PARAMS_URL.get("troca"), token: PARAMS_URL.get("token"), resposta: PARAMS_URL.get("resposta") }
  : null;

// -------------------------------------------------------------------------
// 2. AUTENTICAÇÃO
// -------------------------------------------------------------------------
auth.onAuthStateChanged(async (user) => {
  if (LINK_TROCA) return; // a resposta por link é tratada à parte, sem depender de login
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
  await carregarDadosIniciais();
  renderApp();
});

if (LINK_TROCA) processarLinkConfirmacaoTroca();

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
// 3. CARREGAR / SEMEAR DADOS INICIAIS (tipos de escala e valores)
// -------------------------------------------------------------------------
async function carregarDadosIniciais() {
  // Tipos de escala
  let snap = await db.collection("tiposEscala").get();
  if (snap.empty) {
    const lote = db.batch();
    TIPOS_ESCALA_PADRAO.forEach(t => lote.set(db.collection("tiposEscala").doc(t.id), { nome:t.nome, codigos:t.codigos, criadoEm: Date.now() }));
    await lote.commit();
    snap = await db.collection("tiposEscala").get();
  }
  ESTADO.cacheTiposEscala = snap.docs.map(d => ({ id:d.id, ...d.data() })).sort((a,b)=>a.nome.localeCompare(b.nome));

  // Valores de plantão
  let vsnap = await db.collection("valoresPlantao").get();
  if (vsnap.empty) {
    const lote = db.batch();
    VALORES_PADRAO.forEach(v => lote.set(db.collection("valoresPlantao").doc(), v));
    await lote.commit();
    vsnap = await db.collection("valoresPlantao").get();
  }
  ESTADO.cacheValoresPlantao = vsnap.docs.map(d => ({ id:d.id, ...d.data() }));

  // Perfis de acesso (permissões por tela)
  let psnap = await db.collection("perfis").get();
  if (psnap.empty) {
    const lote = db.batch();
    PERFIS_PADRAO.forEach(p => lote.set(db.collection("perfis").doc(p.id), { nome:p.nome, cor:p.cor, protegido:!!p.protegido, permissoes:p.permissoes }));
    await lote.commit();
    psnap = await db.collection("perfis").get();
  }
  ESTADO.cachePerfis = psnap.docs.map(d => ({ id:d.id, ...d.data() }));

  // Entidades (locais/unidades onde os plantões acontecem) - sem seed padrão, cadastro livre
  const esnap = await db.collection("entidades").get();
  ESTADO.cacheEntidades = esnap.docs.map(d => ({ id:d.id, ...d.data() })).sort((a,b)=>(a.nomeFantasia||a.razaoSocial||"").localeCompare(b.nomeFantasia||b.razaoSocial||""));
}
async function recarregarEntidades() {
  const snap = await db.collection("entidades").get();
  ESTADO.cacheEntidades = snap.docs.map(d => ({ id:d.id, ...d.data() })).sort((a,b)=>(a.nomeFantasia||a.razaoSocial||"").localeCompare(b.nomeFantasia||b.razaoSocial||""));
}
async function recarregarPerfis() {
  const snap = await db.collection("perfis").get();
  ESTADO.cachePerfis = snap.docs.map(d => ({ id:d.id, ...d.data() }));
}

async function recarregarTiposEscala() {
  const snap = await db.collection("tiposEscala").get();
  ESTADO.cacheTiposEscala = snap.docs.map(d => ({ id:d.id, ...d.data() })).sort((a,b)=>a.nome.localeCompare(b.nome));
}
async function recarregarValoresPlantao() {
  const snap = await db.collection("valoresPlantao").get();
  ESTADO.cacheValoresPlantao = snap.docs.map(d => ({ id:d.id, ...d.data() }));
}

function buscarValorHora(setorId, categoria) {
  const lista = ESTADO.cacheValoresPlantao;
  const combos = [
    v => v.setorId === setorId && v.categoria === categoria,
    v => v.setorId === setorId && v.categoria === "Todos",
    v => v.setorId === "todos" && v.categoria === categoria,
    v => v.setorId === "todos" && v.categoria === "Todos",
  ];
  for (const teste of combos) { const achado = lista.find(teste); if (achado) return achado.valorHora; }
  return 0;
}

// -------------------------------------------------------------------------
// 4. SHELL DO APP + ROTEAMENTO
// -------------------------------------------------------------------------
function nomePerfil(id) { if (id === "pendente") return "Aguardando aprovação"; return ESTADO.cachePerfis.find(p=>p.id===id)?.nome || id; }
function telaBaseDe(id) { return (id.startsWith("escala-") || id === "consultar-escalas") ? "escalas" : id; }
function nivelAcesso(telaBase) {
  if (ESTADO.usuarioDoc.perfil === "administrador") return "editar"; // administrador sempre tem acesso total, protegido contra bloqueio acidental
  const perfil = ESTADO.cachePerfis.find(p => p.id === ESTADO.usuarioDoc.perfil);
  if (!perfil) return "nenhum";
  return perfil.permissoes?.[telaBase] || "nenhum";
}
function podeVerTela(id) { return nivelAcesso(telaBaseDe(id)) !== "nenhum"; }
function podeEditarTela(id) { return nivelAcesso(telaBaseDe(id)) === "editar"; }

function montarNav() {
  const navEscalas = ESTADO.cacheTiposEscala.map(t => ({ id:`escala-${t.id}`, label:`Escala · ${t.nome}${t.entidadeId?` (${nomeEntidade(t.entidadeId)})`:""}`, icone:"📋" }));
  return [
    // Ordem pensada para seguir a sequência natural de alimentação do sistema:
    // primeiro os cadastros-base (quem, onde, o quê), depois a operação do dia a dia,
    // e por último acompanhamento/relatórios.
    { id:"entidades", label:"1. Cadastro de Entidades", icone:"🏢" },
    { id:"profissionais", label:"2. Cadastro de Profissionais", icone:"👥" },
    { id:"tipos-escala", label:"3. Cadastro de Tipos de Plantão", icone:"🗂️" },
    { id:"valores-plantao", label:"4. Valores de Plantões", icone:"💰" },
    { id:"usuarios", label:"5. Usuários e Perfis", icone:"🔑" },
    { id:"competencias", label:"6. Competências", icone:"📅" },
    ...navEscalas,
    { id:"consultar-escalas", label:"Consultar Escalas", icone:"🗓️" },
    { id:"trocas", label:"Trocas de Plantão", icone:"🔄" },
    { id:"relatorios", label:"Relatórios", icone:"📈" },
    { id:"fechamento", label:"Fechamento", icone:"🧾" },
    { id:"dashboard", label:"Painel Geral", icone:"📊" },
  ];
}

function podeAcessar(nav, telaId) {
  return nav.some(n => n.id === telaId) && podeVerTela(telaId);
}

function renderApp() {
  const perfil = ESTADO.usuarioDoc.perfil;
  const NAV = montarNav();
  const navHtml = NAV.filter(n => podeVerTela(n.id)).map(n => `
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
          <span class="perfil-tag">${nomePerfil(perfil)}</span>
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

  if (!podeAcessar(NAV, ESTADO.telaAtual)) ESTADO.telaAtual = "dashboard";

  if (ESTADO.telaAtual.startsWith("escala-")) { renderEscala(ESTADO.telaAtual.replace("escala-","")); return; }

  const rotas = {
    "dashboard": renderDashboard,
    "profissionais": renderProfissionais,
    "entidades": renderEntidades,
    "relatorios": renderRelatorios,
    "fechamento": renderFechamento,
    "consultar-escalas": renderConsultarEscalas,
    "tipos-escala": renderTiposEscala,
    "valores-plantao": renderValoresPlantao,
    "competencias": renderCompetencias,
    "trocas": renderTrocas,
    "usuarios": renderUsuarios,
  };
  (rotas[ESTADO.telaAtual] || renderDashboard)();
}

function escapeHtml(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function fmtMoeda(v) { return (v || 0).toLocaleString("pt-BR", { style:"currency", currency:"BRL" }); }
function corTexto(hex) {
  if (!hex) return "#111";
  const c = hex.replace("#","");
  const r=parseInt(c.substr(0,2),16), g=parseInt(c.substr(2,2),16), b=parseInt(c.substr(4,2),16);
  const lum = (0.299*r+0.587*g+0.114*b)/255;
  return lum > 0.62 ? "#1f2937" : "#ffffff";
}
function fmtData2(d) { return String(d).padStart(2,"0"); }
// Retorna {inicioTexto:"02/08/2026 07:00", fimTexto:"02/08/2026 19:00"} a partir do dia/mês/ano + código do tipo de escala
function periodoDoTurno(ano, mes, dia, infoCodigo) {
  const inicio = infoCodigo?.inicio || "07:00";
  const horas = infoCodigo?.horas || 0;
  const [hh,mm] = inicio.split(":").map(Number);
  const dtInicio = new Date(ano, mes-1, dia, hh, mm);
  const dtFim = new Date(dtInicio.getTime() + horas*60*60*1000);
  const fmt = dt => `${fmtData2(dt.getDate())}/${fmtData2(dt.getMonth()+1)}/${dt.getFullYear()} ${fmtData2(dt.getHours())}:${fmtData2(dt.getMinutes())}`;
  return { inicioTexto: fmt(dtInicio), fimTexto: fmt(dtFim) };
}

// Envia e-mail via EmailJS se configurado; se não estiver configurado, não faz nada
// (a notificação dentro do sistema, na tela "Trocas de Plantão", sempre funciona).
async function enviarEmail(paraEmail, assunto, corpoHtml) {
  if (!paraEmail || !EMAILJS_CONFIG?.publicKey || !EMAILJS_CONFIG?.serviceId || !EMAILJS_CONFIG?.templateId || !window.emailjs) return false;
  try {
    await emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, { to_email: paraEmail, subject: assunto, corpo: corpoHtml, corpo_html: corpoHtml });
    return true;
  } catch (err) { console.warn("Falha ao enviar e-mail (a notificação interna do sistema continua funcionando):", err); return false; }
}

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
  await carregarEntidades();
  const podeEditar = podeEditarTela("profissionais");

  vp.innerHTML = `
    <div class="cabecalho-pagina">
      <div><h2>Cadastro de Profissionais</h2><div class="desc">${lista.length} profissionais cadastrados</div></div>
      ${podeEditar ? `<div class="acoes-topo" style="display:flex;gap:8px">
        ${lista.length === 0 ? `<button class="btn btn-secundario" id="btnImportar">📥 Importar lista da planilha (${PROFISSIONAIS_INICIAIS.length})</button>` : ""}
        <button class="btn btn-primario" id="btnNovoProf">+ Novo profissional</button>
      </div>` : ""}
    </div>
    <div class="cartao" style="overflow:auto">
      <table class="tabela" id="tabelaProf">
        <thead><tr><th>Nome</th><th>Profissão</th><th>Entidade</th><th>CRM/COREN</th><th>Telefone</th><th>E-mail</th><th>Emite N.F.</th><th>Status</th>${podeEditar?"<th></th>":""}</tr></thead>
        <tbody>
          ${lista.map(p => `
            <tr>
              <td>${escapeHtml(p.nome)}</td>
              <td>${escapeHtml(p.categoria||"Médico")}</td>
              <td>${escapeHtml(nomeEntidade(p.entidadeId))}</td>
              <td>${escapeHtml(p.crm||"-")}${p.ufCrm?"/"+escapeHtml(p.ufCrm):""}</td>
              <td>${escapeHtml(p.telefone1||"-")}</td>
              <td>${escapeHtml(p.email||"-")}</td>
              <td>${p.emiteNF ? '<span class="badge badge-azul">SIM</span>' : '<span class="badge badge-cinza">NÃO</span>'}</td>
              <td>${p.ativo !== false ? '<span class="badge badge-verde">Ativo</span>' : '<span class="badge badge-vermelho">Inativo</span>'}</td>
              ${podeEditar ? `<td>
                  <button class="icone-acao" data-afastamento="${p.id}" title="Afastamentos/Faltas">🗓️</button>
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
    vp.querySelectorAll("[data-afastamento]").forEach(b => b.addEventListener("click", () => {
      modalAfastamentos(lista.find(p => p.id === b.dataset.afastamento));
    }));
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
    lote.set(ref, { nome:p.nome, categoria:"Médico", entidadeId:"", email:"", telefone1:"", telefone2:"", dataNascimento:"",
      crm:p.crm, ufCrm:"SP", rqe:"", cns:"", cpf:p.cpf, agencia:p.agencia, nomeAgencia:p.nomeAgencia, conta:p.conta, pix:p.pix, emiteNF:p.emiteNF, ativo:true });
  });
  await lote.commit();
  renderProfissionais();
}

const UFS_BRASIL = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

function modalProfissional(prof) {
  const editando = !!prof;
  const p = prof || { nome:"",categoria:"Médico",entidadeId:"",email:"",telefone1:"",telefone2:"",dataNascimento:"",
    crm:"",ufCrm:"SP",rqe:"",cns:"",cpf:"",agencia:"",nomeAgencia:"",conta:"",pix:"",emiteNF:false,ativo:true,
    limiteHorasSemanais:44, limiteHorasMensais:220 };
  const div = document.createElement("div");
  div.className = "modal-fundo";
  div.innerHTML = `
    <div class="modal" style="max-width:600px">
      <h3>${editando ? "Editar" : "Novo"} profissional</h3>

      <label style="font-size:.78rem;font-weight:700;color:var(--azul-esc);text-transform:uppercase">Dados pessoais</label>
      <div class="campo" style="margin-top:8px"><label>Nome completo *</label><input id="mNome" value="${escapeHtml(p.nome)}"></div>
      <div class="campos-2">
        <div class="campo"><label>E-mail</label><input type="email" id="mEmail" value="${escapeHtml(p.email)}"></div>
        <div class="campo"><label>Data de nascimento</label><input type="date" id="mNascimento" value="${escapeHtml(p.dataNascimento)}"></div>
        <div class="campo"><label>Telefone 1</label><input id="mTel1" placeholder="(00) 00000-0000" value="${escapeHtml(p.telefone1)}"></div>
        <div class="campo"><label>Telefone 2</label><input id="mTel2" placeholder="(00) 00000-0000" value="${escapeHtml(p.telefone2)}"></div>
      </div>

      <label style="font-size:.78rem;font-weight:700;color:var(--azul-esc);text-transform:uppercase">Dados profissionais</label>
      <div class="campos-2" style="margin-top:8px">
        <div class="campo"><label>Profissão *</label>
          <select id="mCategoria">${CATEGORIAS_PROFISSIONAL.map(c=>`<option value="${c}" ${p.categoria===c?"selected":""}>${c}</option>`).join("")}</select>
        </div>
        <div class="campo"><label>Entidade / local de trabalho</label>
          <select id="mEntidade">
            <option value="">— Não vinculado —</option>
            ${ESTADO.cacheEntidades.map(e=>`<option value="${e.id}" ${p.entidadeId===e.id?"selected":""}>${escapeHtml(e.nomeFantasia||e.razaoSocial)}</option>`).join("")}
          </select>
        </div>
      </div>
      <div class="campos-2">
        <div class="campo"><label>N° CRM/COREN</label><input id="mCrm" value="${escapeHtml(p.crm)}"></div>
        <div class="campo"><label>UF do registro</label><select id="mUfCrm">${UFS_BRASIL.map(u=>`<option ${p.ufCrm===u?"selected":""}>${u}</option>`).join("")}</select></div>
        <div class="campo"><label>RQE</label><input id="mRqe" value="${escapeHtml(p.rqe)}"></div>
        <div class="campo"><label>CNS</label><input id="mCns" value="${escapeHtml(p.cns)}"></div>
      </div>
      <div class="campos-2">
        <div class="campo"><label>Limite de horas semanais</label><input type="number" id="mLimiteSemanal" value="${p.limiteHorasSemanais ?? 44}"></div>
        <div class="campo"><label>Limite de horas mensais</label><input type="number" id="mLimiteMensal" value="${p.limiteHorasMensais ?? 220}"></div>
      </div>

      <label style="font-size:.78rem;font-weight:700;color:var(--azul-esc);text-transform:uppercase">Dados bancários</label>
      <div class="campos-2" style="margin-top:8px">
        <div class="campo"><label>CPF/CNPJ</label><input id="mCpf" value="${escapeHtml(p.cpf)}"></div>
        <div class="campo"><label>PIX</label><input id="mPix" value="${escapeHtml(p.pix)}"></div>
        <div class="campo"><label>Agência</label><input id="mAgencia" value="${escapeHtml(p.agencia)}"></div>
        <div class="campo"><label>Nome do banco</label><input id="mNomeAgencia" value="${escapeHtml(p.nomeAgencia)}"></div>
        <div class="campo"><label>Conta corrente</label><input id="mConta" value="${escapeHtml(p.conta)}"></div>
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
      categoria: div.querySelector("#mCategoria").value,
      entidadeId: div.querySelector("#mEntidade").value,
      email: div.querySelector("#mEmail").value.trim(),
      telefone1: div.querySelector("#mTel1").value.trim(),
      telefone2: div.querySelector("#mTel2").value.trim(),
      dataNascimento: div.querySelector("#mNascimento").value,
      crm: div.querySelector("#mCrm").value.trim(),
      ufCrm: div.querySelector("#mUfCrm").value,
      rqe: div.querySelector("#mRqe").value.trim(),
      cns: div.querySelector("#mCns").value.trim(),
      cpf: div.querySelector("#mCpf").value.trim(),
      agencia: div.querySelector("#mAgencia").value.trim(),
      nomeAgencia: div.querySelector("#mNomeAgencia").value.trim(),
      conta: div.querySelector("#mConta").value.trim(),
      pix: div.querySelector("#mPix").value.trim(),
      emiteNF: div.querySelector("#mEmiteNF").checked,
      limiteHorasSemanais: +div.querySelector("#mLimiteSemanal").value || 44,
      limiteHorasMensais: +div.querySelector("#mLimiteMensal").value || 220,
      ativo: div.querySelector("#mAtivo").checked,
    };
    if (!dados.nome) { alert("Informe o nome."); return; }
    if (editando) await db.collection("profissionais").doc(p.id).update(dados);
    else await db.collection("profissionais").doc().set(dados);
    div.remove();
    renderProfissionais();
  });
}

const TIPOS_AFASTAMENTO = ["Falta","Férias","Atestado Médico","Licença Maternidade/Paternidade","Licença Prêmio","Outro"];

async function modalAfastamentos(prof) {
  const div = document.createElement("div");
  div.className = "modal-fundo";
  div.innerHTML = `<div class="modal" style="max-width:560px"><h3>Afastamentos/Faltas — ${escapeHtml(prof.nome)}</h3><div id="areaAfast">Carregando...</div></div>`;
  document.body.appendChild(div);
  div.addEventListener("click", (e) => { if (e.target === div) div.remove(); });

  async function recarregar() {
    const snap = await db.collection("afastamentos").where("profissionalId","==",prof.id).get();
    const lista = snap.docs.map(d => ({ id:d.id, ...d.data() })).sort((a,b)=>b.dataInicio.localeCompare(a.dataInicio));
    document.getElementById("areaAfast").innerHTML = `
      <div class="campos-2">
        <div class="campo"><label>Tipo</label><select id="afTipo">${TIPOS_AFASTAMENTO.map(t=>`<option>${t}</option>`).join("")}</select></div>
        <div class="campo"><label>Motivo/Observação</label><input id="afMotivo" placeholder="Opcional"></div>
        <div class="campo"><label>Data início</label><input type="date" id="afInicio"></div>
        <div class="campo"><label>Data fim</label><input type="date" id="afFim"></div>
      </div>
      <button class="btn btn-secundario" id="afAdicionar">+ Adicionar</button>
      <table class="tabela" style="margin-top:14px">
        <thead><tr><th>Tipo</th><th>Início</th><th>Fim</th><th>Motivo</th><th></th></tr></thead>
        <tbody>
          ${lista.map(a => `<tr>
            <td>${escapeHtml(a.tipo)}</td><td>${a.dataInicio}</td><td>${a.dataFim}</td><td>${escapeHtml(a.motivo||"-")}</td>
            <td><button class="icone-acao" data-excluirAf="${a.id}">🗑️</button></td>
          </tr>`).join("") || `<tr><td colspan="5">Nenhum registro.</td></tr>`}
        </tbody>
      </table>
      <div class="acoes"><button class="btn btn-secundario" id="afFechar">Fechar</button></div>`;

    document.getElementById("afAdicionar").addEventListener("click", async () => {
      const dataInicio = document.getElementById("afInicio").value;
      const dataFim = document.getElementById("afFim").value || dataInicio;
      if (!dataInicio) { alert("Informe a data de início."); return; }
      await db.collection("afastamentos").add({
        profissionalId: prof.id, profissionalNome: prof.nome,
        tipo: document.getElementById("afTipo").value,
        motivo: document.getElementById("afMotivo").value.trim(),
        dataInicio, dataFim, criadoEm: Date.now(),
      });
      recarregar();
    });
    document.getElementById("afFechar").addEventListener("click", () => div.remove());
    document.querySelectorAll("[data-excluirAf]").forEach(b => b.addEventListener("click", async () => {
      await db.collection("afastamentos").doc(b.dataset.excluiraf).delete();
      recarregar();
    }));
  }
  recarregar();
}

// -------------------------------------------------------------------------
// 5b. ENTIDADES (locais/unidades onde os plantões acontecem — CNPJ, endereço etc.)
// -------------------------------------------------------------------------
async function carregarEntidades(forcar=false) {
  if (ESTADO.cacheEntidades.length && !forcar) return ESTADO.cacheEntidades;
  return recarregarEntidades().then(() => ESTADO.cacheEntidades);
}

function nomeEntidade(id) {
  if (!id) return "—";
  const e = ESTADO.cacheEntidades.find(x => x.id === id);
  return e ? (e.nomeFantasia || e.razaoSocial) : "—";
}

async function renderEntidades() {
  const vp = document.getElementById("viewport");
  vp.innerHTML = `<div class="cartao">Carregando...</div>`;
  const lista = await carregarEntidades(true);
  const podeEditar = podeEditarTela("entidades");

  vp.innerHTML = `
    <div class="cabecalho-pagina">
      <div><h2>Cadastro de Entidades</h2><div class="desc">Os locais/unidades onde os plantões acontecem (ex.: UPA Central, Hospital Municipal). Vincule profissionais e escalas a cada uma.</div></div>
      ${podeEditar ? `<button class="btn btn-primario" id="btnNovaEntidade">+ Nova entidade</button>` : ""}
    </div>
    <div class="cartao" style="overflow:auto">
      <table class="tabela">
        <thead><tr><th>Nome Fantasia</th><th>Razão Social</th><th>CNPJ</th><th>Bairro</th><th>Telefone</th><th>Status</th>${podeEditar?"<th></th>":""}</tr></thead>
        <tbody>
          ${lista.map(e => `<tr>
            <td>${escapeHtml(e.nomeFantasia||"-")}</td>
            <td>${escapeHtml(e.razaoSocial||"-")}</td>
            <td>${escapeHtml(e.cnpj||"-")}</td>
            <td>${escapeHtml(e.bairro||"-")}</td>
            <td>${escapeHtml(e.telefone||"-")}</td>
            <td>${e.ativo !== false ? '<span class="badge badge-verde">Ativa</span>' : '<span class="badge badge-vermelho">Inativa</span>'}</td>
            ${podeEditar ? `<td><button class="icone-acao" data-editar="${e.id}" title="Editar">✏️</button><button class="icone-acao" data-excluir="${e.id}" title="Excluir">🗑️</button></td>` : ""}
          </tr>`).join("") || `<tr><td colspan="7">Nenhuma entidade cadastrada ainda.</td></tr>`}
        </tbody>
      </table>
    </div>`;

  if (!podeEditar) return;
  document.getElementById("btnNovaEntidade").addEventListener("click", () => modalEntidade());
  vp.querySelectorAll("[data-editar]").forEach(b => b.addEventListener("click", () => modalEntidade(lista.find(e=>e.id===b.dataset.editar))));
  vp.querySelectorAll("[data-excluir]").forEach(b => b.addEventListener("click", async () => {
    if (!confirm("Excluir esta entidade? Profissionais e escalas vinculados a ela ficarão sem vínculo (os dados deles continuam intactos).")) return;
    await db.collection("entidades").doc(b.dataset.excluir).delete();
    renderEntidades();
  }));
}

function modalEntidade(entidade) {
  const editando = !!entidade;
  const e = entidade || { cnpj:"",razaoSocial:"",nomeFantasia:"",endereco:"",bairro:"",cep:"",telefone:"",email:"",ativo:true };
  const div = document.createElement("div");
  div.className = "modal-fundo";
  div.innerHTML = `
    <div class="modal" style="max-width:560px">
      <h3>${editando ? "Editar" : "Nova"} entidade</h3>
      <div class="campos-2">
        <div class="campo"><label>CNPJ</label><input id="eCnpj" placeholder="00.000.000/0000-00" value="${escapeHtml(e.cnpj)}"></div>
        <div class="campo"><label>Nome Fantasia</label><input id="eNomeFantasia" value="${escapeHtml(e.nomeFantasia)}"></div>
      </div>
      <div class="campo"><label>Razão Social</label><input id="eRazaoSocial" value="${escapeHtml(e.razaoSocial)}"></div>
      <div class="campo"><label>Endereço</label><input id="eEndereco" placeholder="Rua, número" value="${escapeHtml(e.endereco)}"></div>
      <div class="campos-2">
        <div class="campo"><label>Bairro</label><input id="eBairro" value="${escapeHtml(e.bairro)}"></div>
        <div class="campo"><label>CEP</label><input id="eCep" placeholder="00000-000" value="${escapeHtml(e.cep)}"></div>
        <div class="campo"><label>Telefone</label><input id="eTelefone" placeholder="(00) 0000-0000" value="${escapeHtml(e.telefone)}"></div>
        <div class="campo"><label>E-mail</label><input type="email" id="eEmail" value="${escapeHtml(e.email)}"></div>
      </div>
      <div class="campo"><label><input type="checkbox" id="eAtivo" ${e.ativo!==false?"checked":""}> Ativa</label></div>
      <div class="acoes">
        <button class="btn btn-secundario" id="mCancelar">Cancelar</button>
        <button class="btn btn-primario" id="mSalvar">Salvar</button>
      </div>
    </div>`;
  document.body.appendChild(div);
  div.querySelector("#mCancelar").addEventListener("click", () => div.remove());
  div.querySelector("#mSalvar").addEventListener("click", async () => {
    const dados = {
      cnpj: div.querySelector("#eCnpj").value.trim(),
      razaoSocial: div.querySelector("#eRazaoSocial").value.trim(),
      nomeFantasia: div.querySelector("#eNomeFantasia").value.trim(),
      endereco: div.querySelector("#eEndereco").value.trim(),
      bairro: div.querySelector("#eBairro").value.trim(),
      cep: div.querySelector("#eCep").value.trim(),
      telefone: div.querySelector("#eTelefone").value.trim(),
      email: div.querySelector("#eEmail").value.trim(),
      ativo: div.querySelector("#eAtivo").checked,
    };
    if (!dados.razaoSocial && !dados.nomeFantasia) { alert("Informe ao menos a Razão Social ou o Nome Fantasia."); return; }
    if (editando) await db.collection("entidades").doc(e.id).update(dados);
    else await db.collection("entidades").doc().set(dados);
    div.remove();
    await recarregarEntidades();
    renderEntidades();
  });
}

// -------------------------------------------------------------------------
// 6. TIPOS DE ESCALA (criação livre pelo usuário)
// -------------------------------------------------------------------------
async function renderTiposEscala() {
  const vp = document.getElementById("viewport");
  await recarregarTiposEscala();
  await carregarEntidades();
  const lista = ESTADO.cacheTiposEscala;
  const podeEditar = podeEditarTela("tipos-escala");

  vp.innerHTML = `
    <div class="cabecalho-pagina">
      <div><h2>Tipos de Escala</h2><div class="desc">Crie quantas escalas quiser: Plantões, Enfermagem, Técnicos, Motoristas etc. — e vincule cada uma a uma entidade.</div></div>
      ${podeEditar ? `<button class="btn btn-primario" id="btnNovoTipo">+ Novo tipo de escala</button>` : ""}
    </div>
    <div class="grade-cartoes">
      ${lista.map(t => `
        <div class="cartao">
          <div style="display:flex;justify-content:space-between;align-items:start">
            <div>
              <h3 style="margin:0 0 2px">${escapeHtml(t.nome)}</h3>
              ${t.entidadeId ? `<div style="font-size:.78rem;color:#6b7280">🏢 ${escapeHtml(nomeEntidade(t.entidadeId))}</div>` : ""}
            </div>
            ${podeEditar ? `<div>
              <button class="icone-acao" data-editar="${t.id}" title="Editar">✏️</button>
              <button class="icone-acao" data-excluir="${t.id}" title="Excluir">🗑️</button>
            </div>` : ""}
          </div>
          <div class="legenda-codigos">
            ${(t.codigos||[]).map(c => `<span style="background:${c.cor};color:${corTexto(c.cor)}">${c.codigo} — ${c.nome} (${c.horas}h)</span>`).join("")}
          </div>
        </div>`).join("")}
    </div>`;

  if (!podeEditar) return;
  document.getElementById("btnNovoTipo").addEventListener("click", () => modalTipoEscala());
  vp.querySelectorAll("[data-editar]").forEach(b => b.addEventListener("click", () => modalTipoEscala(lista.find(t=>t.id===b.dataset.editar))));
  vp.querySelectorAll("[data-excluir]").forEach(b => b.addEventListener("click", async () => {
    if (!confirm("Excluir este tipo de escala? As escalas já preenchidas com ele deixarão de aparecer no menu (os dados continuam salvos).")) return;
    await db.collection("tiposEscala").doc(b.dataset.excluir).delete();
    renderTiposEscala();
  }));
}

function modalTipoEscala(tipo) {
  const editando = !!tipo;
  const t = tipo || { nome:"", entidadeId:"", codigos:[{codigo:"",nome:"",horas:12,inicio:"07:00",cor:PALETA_CORES[0]}] };
  const div = document.createElement("div");
  div.className = "modal-fundo";

  function linhasCodigosHtml(codigos) {
    return codigos.map((c,i) => `
      <div class="linha-codigo" data-idx="${i}">
        <input class="cCodigo" maxlength="3" placeholder="Código" value="${escapeHtml(c.codigo)}" style="width:56px">
        <input class="cNome" placeholder="Nome (ex.: Noite)" value="${escapeHtml(c.nome)}">
        <input class="cInicio" type="time" value="${c.inicio||"07:00"}" title="Horário de início" style="width:100px">
        <input class="cHoras" type="number" step="0.5" placeholder="Horas" value="${c.horas}" style="width:72px" title="Duração em horas">
        <input class="cCor" type="color" value="${c.cor||"#2c3e70"}">
        <button type="button" class="icone-acao btnRemoverLinha" title="Remover">🗑️</button>
      </div>`).join("");
  }

  div.innerHTML = `
    <div class="modal" style="max-width:560px">
      <h3>${editando ? "Editar" : "Novo"} tipo de escala</h3>
      <div class="campo"><label>Nome da escala</label><input id="tNome" placeholder="Ex.: Escala - Enfermagem" value="${escapeHtml(t.nome)}"></div>
      <div class="campo"><label>Entidade / local</label>
        <select id="tEntidade">
          <option value="">— Não vinculado —</option>
          ${ESTADO.cacheEntidades.map(e=>`<option value="${e.id}" ${t.entidadeId===e.id?"selected":""}>${escapeHtml(e.nomeFantasia||e.razaoSocial)}</option>`).join("")}
        </select>
      </div>
      <label style="font-size:.8rem;font-weight:600;color:#374151">Códigos desta escala (código, nome, horário de início, duração em horas, cor)</label>
      <div id="areaLinhasCodigo" style="margin-top:6px;display:flex;flex-direction:column;gap:6px">${linhasCodigosHtml(t.codigos)}</div>
      <button type="button" class="btn btn-secundario" id="btnAddLinha" style="margin-top:10px">+ Adicionar código</button>
      <div class="acoes">
        <button class="btn btn-secundario" id="mCancelar">Cancelar</button>
        <button class="btn btn-primario" id="mSalvar">Salvar</button>
      </div>
    </div>`;
  document.body.appendChild(div);

  function ligarRemocao() {
    div.querySelectorAll(".btnRemoverLinha").forEach(b => b.addEventListener("click", () => {
      const linha = b.closest(".linha-codigo");
      if (div.querySelectorAll(".linha-codigo").length <= 1) { alert("Mantenha pelo menos um código."); return; }
      linha.remove();
    }));
  }
  ligarRemocao();

  div.querySelector("#btnAddLinha").addEventListener("click", () => {
    const area = div.querySelector("#areaLinhasCodigo");
    const cor = PALETA_CORES[area.children.length % PALETA_CORES.length];
    area.insertAdjacentHTML("beforeend", linhasCodigosHtml([{codigo:"",nome:"",horas:12,inicio:"07:00",cor}]));
    ligarRemocao();
  });

  div.querySelector("#mCancelar").addEventListener("click", () => div.remove());
  div.querySelector("#mSalvar").addEventListener("click", async () => {
    const nome = div.querySelector("#tNome").value.trim();
    if (!nome) { alert("Informe o nome da escala."); return; }
    const entidadeId = div.querySelector("#tEntidade").value;
    const codigos = [...div.querySelectorAll(".linha-codigo")].map(linha => ({
      codigo: linha.querySelector(".cCodigo").value.trim().toUpperCase(),
      nome: linha.querySelector(".cNome").value.trim(),
      inicio: linha.querySelector(".cInicio").value || "07:00",
      horas: +linha.querySelector(".cHoras").value || 0,
      cor: linha.querySelector(".cCor").value,
    })).filter(c => c.codigo);
    if (!codigos.length) { alert("Adicione pelo menos um código válido."); return; }
    if (editando) await db.collection("tiposEscala").doc(t.id).update({ nome, entidadeId, codigos });
    else await db.collection("tiposEscala").doc().set({ nome, entidadeId, codigos, criadoEm: Date.now() });
    div.remove();
    await recarregarTiposEscala();
    renderApp();
    ESTADO.telaAtual = "tipos-escala";
    renderTiposEscala();
  });
}

// -------------------------------------------------------------------------
// 7. VALORES DE PLANTÕES (R$/hora por tipo de escala e categoria profissional)
// -------------------------------------------------------------------------
async function renderValoresPlantao() {
  const vp = document.getElementById("viewport");
  await recarregarValoresPlantao();
  await recarregarTiposEscala();
  const lista = ESTADO.cacheValoresPlantao;
  const nomeSetor = id => id === "todos" ? "Todos os tipos" : (ESTADO.cacheTiposEscala.find(t=>t.id===id)?.nome || id);
  const podeEditar = podeEditarTela("valores-plantao");

  vp.innerHTML = `
    <div class="cabecalho-pagina">
      <div><h2>Valores de Plantões</h2><div class="desc">Valor pago por hora, podendo variar por tipo de escala e categoria profissional.</div></div>
      ${podeEditar ? `<button class="btn btn-primario" id="btnNovoValor">+ Novo</button>` : ""}
    </div>
    <div class="cartao" style="overflow:auto">
      <table class="tabela">
        <thead><tr><th>Descrição</th><th>Tipo de escala</th><th>Categoria</th><th>Valor por hora</th>${podeEditar?"<th></th>":""}</tr></thead>
        <tbody>
          ${lista.map(v => `<tr>
            <td>${escapeHtml(v.descricao)}</td>
            <td>${escapeHtml(nomeSetor(v.setorId))}</td>
            <td>${escapeHtml(v.categoria)}</td>
            <td>${fmtMoeda(v.valorHora)}</td>
            ${podeEditar ? `<td><button class="icone-acao" data-editar="${v.id}">✏️</button><button class="icone-acao" data-excluir="${v.id}">🗑️</button></td>` : ""}
          </tr>`).join("")}
        </tbody>
      </table>
    </div>
    <p style="font-size:.8rem;color:#6b7280">A cobrança é sempre por hora: as horas de cada código (N, D, 24h, V etc.) são definidas em "Tipos de Escala".
    Ao gerar um relatório, o sistema procura o valor mais específico primeiro (mesmo tipo de escala + mesma categoria do profissional), depois vai afrouxando a busca até achar um valor "Todos".</p>`;

  if (!podeEditar) return;
  document.getElementById("btnNovoValor").addEventListener("click", () => modalValorPlantao());
  vp.querySelectorAll("[data-editar]").forEach(b => b.addEventListener("click", () => modalValorPlantao(lista.find(v=>v.id===b.dataset.editar))));
  vp.querySelectorAll("[data-excluir]").forEach(b => b.addEventListener("click", async () => {
    if (!confirm("Excluir este valor?")) return;
    await db.collection("valoresPlantao").doc(b.dataset.excluir).delete();
    renderValoresPlantao();
  }));
}

function modalValorPlantao(valor) {
  const editando = !!valor;
  const v = valor || { descricao:"", setorId: ESTADO.cacheTiposEscala[0]?.id || "todos", categoria:"Todos", valorHora:0 };
  const div = document.createElement("div");
  div.className = "modal-fundo";
  div.innerHTML = `
    <div class="modal">
      <h3>${editando ? "Editar" : "Novo"} valor de plantão</h3>
      <div class="campo"><label>Descrição</label><input id="vDescricao" placeholder="Ex.: Plantão Enfermagem Noturno" value="${escapeHtml(v.descricao)}"></div>
      <div class="campo"><label>Tipo de escala</label>
        <select id="vSetor">
          <option value="todos" ${v.setorId==="todos"?"selected":""}>Todos os tipos</option>
          ${ESTADO.cacheTiposEscala.map(t=>`<option value="${t.id}" ${v.setorId===t.id?"selected":""}>${escapeHtml(t.nome)}</option>`).join("")}
        </select>
      </div>
      <div class="campo"><label>Categoria profissional</label>
        <select id="vCategoria">
          <option value="Todos" ${v.categoria==="Todos"?"selected":""}>Todas as categorias</option>
          ${CATEGORIAS_PROFISSIONAL.map(c=>`<option value="${c}" ${v.categoria===c?"selected":""}>${c}</option>`).join("")}
        </select>
      </div>
      <div class="campo"><label>Valor por hora (R$)</label><input id="vValor" type="number" step="0.01" value="${v.valorHora}"></div>
      <div class="acoes">
        <button class="btn btn-secundario" id="mCancelar">Cancelar</button>
        <button class="btn btn-primario" id="mSalvar">Salvar</button>
      </div>
    </div>`;
  document.body.appendChild(div);
  div.querySelector("#mCancelar").addEventListener("click", () => div.remove());
  div.querySelector("#mSalvar").addEventListener("click", async () => {
    const dados = {
      descricao: div.querySelector("#vDescricao").value.trim(),
      setorId: div.querySelector("#vSetor").value,
      categoria: div.querySelector("#vCategoria").value,
      valorHora: +div.querySelector("#vValor").value || 0,
    };
    if (!dados.descricao) { alert("Informe a descrição."); return; }
    if (editando) await db.collection("valoresPlantao").doc(v.id).update(dados);
    else await db.collection("valoresPlantao").doc().set(dados);
    div.remove();
    renderValoresPlantao();
  });
}

// -------------------------------------------------------------------------
// 8. COMPETÊNCIAS (períodos mensais — travar edição após o fechamento)
// -------------------------------------------------------------------------
function idCompetencia(ano, mes) { return `${ano}-${mes}`; }

async function statusCompetencia(ano, mes) {
  const snap = await db.collection("competencias").doc(idCompetencia(ano,mes)).get();
  return snap.exists ? snap.data().status : "aberta";
}

async function renderCompetencias() {
  const vp = document.getElementById("viewport");
  vp.innerHTML = `<div class="cartao">Carregando...</div>`;
  const hoje = new Date();
  const periodos = [];
  for (let ano = hoje.getFullYear()-1; ano <= hoje.getFullYear()+1; ano++) {
    for (let mes = 1; mes <= 12; mes++) periodos.push({ ano, mes });
  }
  const snap = await db.collection("competencias").get();
  const fechadas = {}; snap.docs.forEach(d => fechadas[d.id] = d.data());
  const souAdmin = podeEditarTela("competencias");

  vp.innerHTML = `
    <div class="cabecalho-pagina">
      <div><h2>Competências</h2><div class="desc">Todos os meses ficam sempre disponíveis para consulta. Fechar uma competência apenas bloqueia novas edições na escala daquele mês, preservando o histórico para relatórios futuros.</div></div>
    </div>
    <div class="cartao" style="overflow:auto;max-height:70vh">
      <table class="tabela">
        <thead><tr><th>Competência</th><th>Status</th>${souAdmin ? "<th></th>" : ""}</tr></thead>
        <tbody>
          ${periodos.slice().reverse().map(p => {
            const id = idCompetencia(p.ano,p.mes);
            const dado = fechadas[id];
            const fechada = dado && dado.status === "fechada";
            return `<tr data-id="${id}" data-ano="${p.ano}" data-mes="${p.mes}">
              <td>${MESES[p.mes-1]} de ${p.ano}</td>
              <td>${fechada ? `<span class="badge badge-vermelho">🔒 Fechada</span>` : `<span class="badge badge-verde">Aberta</span>`}</td>
              ${souAdmin ? `<td><button class="btn ${fechada?"btn-sucesso":"btn-perigo"} btnToggleComp" style="padding:6px 10px">${fechada?"Reabrir":"Fechar"}</button></td>` : ""}
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>`;

  if (souAdmin) {
    vp.querySelectorAll(".btnToggleComp").forEach(btn => btn.addEventListener("click", async () => {
      const tr = btn.closest("tr");
      const id = tr.dataset.id, ano = +tr.dataset.ano, mes = +tr.dataset.mes;
      const atual = await db.collection("competencias").doc(id).get();
      const fechadaAgora = atual.exists && atual.data().status === "fechada";
      if (fechadaAgora) {
        await db.collection("competencias").doc(id).set({ ano, mes, status:"aberta" });
      } else {
        if (!confirm(`Fechar a competência de ${MESES[mes-1]}/${ano}? Ninguém mais poderá editar as escalas desse mês até você reabrir.`)) return;
        await db.collection("competencias").doc(id).set({ ano, mes, status:"fechada", fechadaEm: Date.now(), fechadaPor: ESTADO.usuarioDoc.nome });
      }
      renderCompetencias();
    }));
  }
}

// -------------------------------------------------------------------------
// 9. ESCALA (grade mensal por tipo de escala, dinâmico)
// -------------------------------------------------------------------------
function diasNoMes(ano, mes) { return new Date(ano, mes, 0).getDate(); }
function diaDaSemana(ano, mes, dia) { return new Date(ano, mes-1, dia).getDay(); }

async function renderEscala(setorId) {
  const tipo = ESTADO.cacheTiposEscala.find(t => t.id === setorId);
  const vp = document.getElementById("viewport");
  if (!tipo) { vp.innerHTML = `<div class="cartao">Este tipo de escala não existe mais.</div>`; return; }

  ESTADO.escalaAtual.setorId = setorId;
  const { mes, ano } = ESTADO.escalaAtual;
  vp.innerHTML = `<div class="cartao">Carregando escala...</div>`;

  let profissionais = (await carregarProfissionais()).filter(p => p.ativo !== false);
  const temListaParticipantes = Array.isArray(tipo.participantes);
  if (temListaParticipantes) profissionais = profissionais.filter(p => tipo.participantes.includes(p.id));
  const totalDias = diasNoMes(ano, mes);
  const codigos = tipo.codigos || [];
  const mapaCodigos = {}; codigos.forEach(c => mapaCodigos[c.codigo] = c);
  const statusComp = await statusCompetencia(ano, mes);
  const fechada = statusComp === "fechada";
  const podeEditar = podeEditarTela("escalas") && !fechada;
  const podeGerenciarParticipantes = podeEditarTela("escalas");

  const snap = await db.collection("escalas").where("setor","==",setorId).where("ano","==",ano).where("mes","==",mes).get();
  const escalasPorProf = {};
  snap.docs.forEach(d => { escalasPorProf[d.data().profissionalId] = { id:d.id, ...d.data() }; });

  const anosOpcoes = []; for (let a = new Date().getFullYear()-1; a <= new Date().getFullYear()+1; a++) anosOpcoes.push(a);

  vp.innerHTML = `
    <div class="cabecalho-pagina">
      <div><h2>${escapeHtml(tipo.nome)}</h2><div class="desc">${tipo.entidadeId?`🏢 ${escapeHtml(nomeEntidade(tipo.entidadeId))} — `:""}${fechada ? "🔒 Competência fechada — somente leitura." : (podeEditar ? "Clique numa célula para alterar o código do plantão." : "Modo somente leitura.")}</div></div>
    </div>
    <div class="barra-ferramentas">
      <select id="selMes">${MESES.map((m,i)=>`<option value="${i+1}" ${i+1===mes?"selected":""}>${m}</option>`).join("")}</select>
      <select id="selAno">${anosOpcoes.map(a=>`<option value="${a}" ${a===ano?"selected":""}>${a}</option>`).join("")}</select>
      <button class="btn btn-secundario" id="btnImprimirEscala">🖨️ Imprimir</button>
      ${podeGerenciarParticipantes ? `<button class="btn btn-secundario" id="btnParticipantes">👥 Profissionais desta escala (${profissionais.length})</button>` : ""}
      ${fechada ? `<span class="badge badge-vermelho">🔒 Competência fechada</span>` : ""}
    </div>
    ${temListaParticipantes && profissionais.length === 0 ? `<div class="cartao"><p style="margin:0">Nenhum profissional foi selecionado para esta escala ainda. Clique em "👥 Profissionais desta escala" para escolher quem participa.</p></div>` : ""}
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
              <th>Total horas</th>
            </tr>
          </thead>
          <tbody>
            ${profissionais.map(p => {
              const doc = escalasPorProf[p.id] || { dias:{} };
              const horas = calcularHorasProfissional(doc.dias, mapaCodigos);
              const ehMeuProfissional = p.id === ESTADO.usuarioDoc.profissionalId;
              return `<tr data-prof="${p.id}">
                <td class="nome-prof">${escapeHtml(p.nome)}${p.crm?`<br><small style="font-weight:400;color:#6b7280">CRM ${escapeHtml(p.crm)}${p.ufCrm?"/"+escapeHtml(p.ufCrm):""}</small>`:""}</td>
                ${Array.from({length:totalDias},(_,i)=>{
                  const d=i+1; const cod = doc.dias[d] || "";
                  const dsem=diaDaSemana(ano,mes,d); const fds = dsem===0||dsem===6;
                  const corBg = cod && mapaCodigos[cod] ? mapaCodigos[cod].cor : "";
                  const corTxt = cod && mapaCodigos[cod] ? corTexto(corBg) : "";
                  const podeTrocarCelula = ehMeuProfissional && cod && !fechada && podeVerTela("trocas");
                  let titulo = "";
                  if (cod && mapaCodigos[cod]) {
                    const periodo = periodoDoTurno(ano, mes, d, mapaCodigos[cod]);
                    titulo = `${mapaCodigos[cod].nome} — ${periodo.inicioTexto} até ${periodo.fimTexto}`;
                    if (podeTrocarCelula) titulo += " (clique para solicitar troca)";
                  }
                  return `<td class="dia ${fds?'fds':''} ${podeTrocarCelula?'dia-minha':''}" data-dia="${d}" style="${cod?`background:${corBg};color:${corTxt};`:''}" title="${titulo}">${cod}</td>`;
                }).join("")}
                <td class="total-linha">${horas}h</td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>
      <div class="legenda-codigos">
        ${codigos.map(c => `<span style="background:${c.cor};color:${corTexto(c.cor)}">${c.codigo} — ${c.nome}</span>`).join("")}
      </div>
    </div>`;

  document.getElementById("selMes").addEventListener("change", e => { ESTADO.escalaAtual.mes = +e.target.value; renderEscala(setorId); });
  document.getElementById("selAno").addEventListener("change", e => { ESTADO.escalaAtual.ano = +e.target.value; renderEscala(setorId); });
  document.getElementById("btnImprimirEscala").addEventListener("click", () => window.print());
  document.getElementById("btnParticipantes")?.addEventListener("click", () => modalParticipantesEscala(tipo));

  if (podeEditar) {
    vp.querySelectorAll("td.dia").forEach(td => td.addEventListener("click", async () => {
      const tr = td.closest("tr");
      const profId = tr.dataset.prof;
      const dia = td.dataset.dia;
      const atual = td.textContent.trim();
      const opcoes = ["", ...codigos.map(c=>c.codigo)];
      const prox = opcoes[(opcoes.indexOf(atual)+1) % opcoes.length];
      td.textContent = prox;
      if (prox && mapaCodigos[prox]) {
        td.style.background = mapaCodigos[prox].cor;
        td.style.color = corTexto(mapaCodigos[prox].cor);
        td.title = mapaCodigos[prox].nome;
      } else {
        td.style.background = ""; td.style.color = ""; td.title = "";
      }
      await salvarCelulaEscala(setorId, ano, mes, profId, dia, prox);
      const dias = {}; tr.querySelectorAll("td.dia").forEach(c => { if (c.textContent.trim()) dias[c.dataset.dia] = c.textContent.trim(); });
      tr.querySelector(".total-linha").textContent = calcularHorasProfissional(dias, mapaCodigos) + "h";
    }));
  } else {
    vp.querySelectorAll("td.dia-minha").forEach(td => td.addEventListener("click", () => {
      const dia = +td.dataset.dia;
      const codigo = td.textContent.trim();
      modalSolicitarTroca(tipo, profissionais.find(p=>p.id===ESTADO.usuarioDoc.profissionalId), dia, codigo, ano, mes, mapaCodigos, profissionais);
    }));
  }
}

async function modalParticipantesEscala(tipo) {
  const todos = (await carregarProfissionais()).filter(p => p.ativo !== false);
  const selecionadosAtuais = Array.isArray(tipo.participantes) ? tipo.participantes : todos.map(p=>p.id);
  const div = document.createElement("div");
  div.className = "modal-fundo";
  div.innerHTML = `
    <div class="modal" style="max-width:480px">
      <h3>Profissionais da escala "${escapeHtml(tipo.nome)}"</h3>
      <p style="font-size:.82rem;color:#6b7280;margin-top:-6px">Marque quem deve aparecer na grade desta escala. Desmarcados continuam cadastrados, só não aparecem aqui.</p>
      <div style="display:flex;gap:8px;margin-bottom:8px">
        <button type="button" class="btn btn-secundario" id="btnMarcarTodos" style="padding:6px 10px">Marcar todos</button>
        <button type="button" class="btn btn-secundario" id="btnDesmarcarTodos" style="padding:6px 10px">Desmarcar todos</button>
      </div>
      <div style="max-height:320px;overflow:auto;border:1px solid var(--cinza-borda);border-radius:8px;padding:8px">
        ${todos.map(p => `
          <label style="display:flex;align-items:center;gap:8px;padding:6px 4px;border-bottom:1px solid #f0f2f5">
            <input type="checkbox" class="chkParticipante" value="${p.id}" ${selecionadosAtuais.includes(p.id)?"checked":""}>
            <span>${escapeHtml(p.nome)} <small style="color:#9ca3af">(${escapeHtml(p.categoria||"Médico")})</small></span>
          </label>`).join("") || "<p>Nenhum profissional ativo cadastrado ainda.</p>"}
      </div>
      <div class="acoes">
        <button class="btn btn-secundario" id="mCancelar">Cancelar</button>
        <button class="btn btn-primario" id="mSalvar">Salvar</button>
      </div>
    </div>`;
  document.body.appendChild(div);
  div.querySelector("#btnMarcarTodos").addEventListener("click", () => div.querySelectorAll(".chkParticipante").forEach(c=>c.checked=true));
  div.querySelector("#btnDesmarcarTodos").addEventListener("click", () => div.querySelectorAll(".chkParticipante").forEach(c=>c.checked=false));
  div.querySelector("#mCancelar").addEventListener("click", () => div.remove());
  div.querySelector("#mSalvar").addEventListener("click", async () => {
    const selecionados = [...div.querySelectorAll(".chkParticipante:checked")].map(c=>c.value);
    await db.collection("tiposEscala").doc(tipo.id).update({ participantes: selecionados });
    await recarregarTiposEscala();
    div.remove();
    renderEscala(tipo.id);
  });
}

// -------------------------------------------------------------------------
// 9b. TROCAS DE PLANTÃO
// -------------------------------------------------------------------------
// Fluxo: 1) profissional solicita troca de um plantão seu com um colega  ->
// 2) o colega recebe e-mail/notificação e CONFIRMA ou RECUSA -> 3) se confirmar,
// o Administrador e/ou Diretor Clínico da entidade recebem e-mail/notificação
// para AUTORIZAR -> 4) ao autorizar, o sistema troca as células na escala
// automaticamente.

async function buscarDestinatariosAprovacao(entidadeId) {
  const snap = await db.collection("usuarios").where("ativo","==",true).get();
  return snap.docs.map(d=>d.data())
    .filter(u => (u.perfil === "administrador" || u.perfil === "diretor_clinico"))
    .filter(u => !u.entidadeId || u.entidadeId === entidadeId)
    .filter(u => u.email);
}

function gerarToken() {
  if (window.crypto?.randomUUID) return crypto.randomUUID().replace(/-/g,"");
  return Array.from({length:32}, () => Math.floor(Math.random()*16).toString(16)).join("");
}

function urlBaseApp() { return window.location.origin + window.location.pathname; }

function primeiroNome(nomeCompleto) { return (nomeCompleto||"").trim().split(" ")[0]; }

// ---- Modelos de e-mail (HTML) ----
function montarCorpoEmailConfirmacaoDestino(troca) {
  const linkSim = `${urlBaseApp()}?troca=${troca.id}&token=${troca.tokenDestino}&resposta=sim`;
  const linkNao = `${urlBaseApp()}?troca=${troca.id}&token=${troca.tokenDestino}&resposta=nao`;
  return `
    <div style="font-family:Arial,sans-serif;font-size:15px;color:#1f2937;line-height:1.5">
      <h2 style="margin:0 0 4px">TROCA DE PLANTÃO</h2>
      <p style="margin:0 0 14px">entre ${escapeHtml(primeiroNome(troca.profissionalOrigemNome))} e ${escapeHtml(primeiroNome(troca.profissionalDestinoNome))}</p>
      <p style="margin:0 0 14px">${escapeHtml(troca.entidadeRazaoSocial || troca.entidadeNome || "—")},</p>
      <p style="margin:0">${escapeHtml(troca.profissionalOrigemNome)} responsável pelo plantão:</p>
      <p style="margin:0">${escapeHtml(troca.setorNome)} ${troca.entidadeNomeFantasia?`(${escapeHtml(troca.entidadeNomeFantasia)})`:""}</p>
      <p style="margin:0 0 14px">De ${troca.periodoInicioTexto} até ${troca.periodoFimTexto}</p>
      <p style="margin:0">Solicita troca de plantão com, ${escapeHtml(troca.profissionalDestinoNome)}</p>
      <p style="margin:0">${escapeHtml(troca.setorNome)} ${troca.entidadeNomeFantasia?`(${escapeHtml(troca.entidadeNomeFantasia)})`:""}</p>
      <p style="margin:0 0 14px">De ${troca.periodoInicioTexto} até ${troca.periodoFimTexto}</p>
      <p style="margin:0 0 18px"><b>Motivo:</b> ${escapeHtml(troca.motivo)}</p>
      <p style="margin:0 0 10px;font-weight:bold">Confirme a Troca:</p>
      <a href="${linkSim}" style="display:inline-block;background:#1e8e5a;color:#fff;text-decoration:none;font-weight:bold;padding:12px 28px;border-radius:6px;margin-right:12px">SIM</a>
      <a href="${linkNao}" style="display:inline-block;background:#c0392b;color:#fff;text-decoration:none;font-weight:bold;padding:12px 28px;border-radius:6px">NÃO</a>
      <p style="margin-top:20px;font-size:12px;color:#6b7280">Se os botões não funcionarem, copie e cole este link no navegador para confirmar: ${linkSim}<br>Ou este, para recusar: ${linkNao}</p>
    </div>`;
}

function montarCorpoEmailNovaTrocaAdmin(troca) {
  return `
    <div style="font-family:Arial,sans-serif;font-size:15px;color:#1f2937;line-height:1.5">
      <h2 style="margin:0 0 4px">NOVA TROCA DE PLANTÃO</h2>
      <p style="margin:0 0 14px">entre ${escapeHtml(primeiroNome(troca.profissionalOrigemNome))} e ${escapeHtml(primeiroNome(troca.profissionalDestinoNome))}</p>
      <p style="margin:0 0 14px">${escapeHtml(troca.entidadeRazaoSocial || troca.entidadeNome || "—")},</p>
      <p style="margin:0">${escapeHtml(troca.profissionalOrigemNome)} responsável pelo plantão:</p>
      <p style="margin:0">${escapeHtml(troca.setorNome)} ${troca.entidadeNomeFantasia?`(${escapeHtml(troca.entidadeNomeFantasia)})`:""}</p>
      <p style="margin:0 0 14px">De ${troca.periodoInicioTexto} até ${troca.periodoFimTexto}</p>
      <p style="margin:0">Em troca, ${escapeHtml(troca.profissionalDestinoNome)} é o novo responsável pelo plantão:</p>
      <p style="margin:0">${escapeHtml(troca.setorNome)} ${troca.entidadeNomeFantasia?`(${escapeHtml(troca.entidadeNomeFantasia)})`:""}</p>
      <p style="margin:0 0 14px">De ${troca.periodoInicioTexto} até ${troca.periodoFimTexto}.</p>
      <p style="margin:0 0 18px"><b>Motivo informado:</b> ${escapeHtml(troca.motivo)}</p>
      <p><a href="${urlBaseApp()}" style="display:inline-block;background:#0b5394;color:#fff;text-decoration:none;font-weight:bold;padding:12px 28px;border-radius:6px">Autorizar ou negar no sistema</a></p>
    </div>`;
}

function montarCorpoEmailAvisoOrigem(troca, aceitou) {
  if (aceitou) return `
    <div style="font-family:Arial,sans-serif;font-size:15px;color:#1f2937;line-height:1.5">
      <h2 style="margin:0 0 14px">✅ ${escapeHtml(primeiroNome(troca.profissionalDestinoNome))} confirmou a troca!</h2>
      <p style="margin:0">Seu plantão de ${escapeHtml(troca.setorNome)} do dia ${fmtData2(troca.dia)}/${fmtData2(troca.mes)}/${troca.ano} (${troca.periodoInicioTexto} até ${troca.periodoFimTexto})
      foi confirmado por <b>${escapeHtml(troca.profissionalDestinoNome)}</b>.</p>
      <p style="margin-top:14px">Agora falta só a autorização do Administrador ou Diretor Clínico para a troca valer na escala. Você será avisado assim que isso acontecer.</p>
    </div>`;
  return `
    <div style="font-family:Arial,sans-serif;font-size:15px;color:#1f2937;line-height:1.5">
      <h2 style="margin:0 0 14px">❌ ${escapeHtml(primeiroNome(troca.profissionalDestinoNome))} não aceitou a troca</h2>
      <p style="margin:0">Seu pedido de troca do plantão de ${escapeHtml(troca.setorNome)} do dia ${fmtData2(troca.dia)}/${fmtData2(troca.mes)}/${troca.ano} (${troca.periodoInicioTexto} até ${troca.periodoFimTexto})
      não foi aceito por <b>${escapeHtml(troca.profissionalDestinoNome)}</b>.</p>
      <p style="margin-top:14px">Você pode solicitar a troca novamente com outro profissional, acessando o sistema na tela do seu plantão.</p>
    </div>`;
}

function montarCorpoEmailResultadoFinal(troca, autorizada) {
  const titulo = autorizada ? "✅ Troca de plantão autorizada" : "❌ Troca de plantão negada";
  return `
    <div style="font-family:Arial,sans-serif;font-size:15px;color:#1f2937;line-height:1.5">
      <h2 style="margin:0 0 14px">${titulo}</h2>
      <p style="margin:0">${escapeHtml(troca.setorNome)} — dia ${fmtData2(troca.dia)}/${fmtData2(troca.mes)}/${troca.ano} (${troca.periodoInicioTexto} até ${troca.periodoFimTexto})</p>
      <p style="margin-top:10px">Entre ${escapeHtml(troca.profissionalOrigemNome)} e ${escapeHtml(troca.profissionalDestinoNome)}.</p>
      ${autorizada ? `<p style="margin-top:14px">A escala já foi atualizada automaticamente.</p>` : `<p style="margin-top:14px">${troca.motivoRecusa?("Motivo: "+escapeHtml(troca.motivoRecusa)):""}</p>`}
    </div>`;
}

// ---- Ações compartilhadas (chamadas tanto pelo botão dentro do sistema quanto pelo link do e-mail) ----
async function notificarConfirmacaoDestino(troca) {
  const destinatarios = await buscarDestinatariosAprovacao(troca.entidadeId);
  for (const dest of destinatarios) await enviarEmail(dest.email, `Nova troca de plantão — ${troca.profissionalOrigemNome} / ${troca.profissionalDestinoNome}`, montarCorpoEmailNovaTrocaAdmin(troca));
  await enviarEmail(troca.profissionalOrigemEmail, "Sua troca de plantão foi confirmada pelo colega", montarCorpoEmailAvisoOrigem(troca, true));
}
async function notificarRecusaDestino(troca) {
  await enviarEmail(troca.profissionalOrigemEmail, "Sua troca de plantão não foi aceita", montarCorpoEmailAvisoOrigem(troca, false));
}

function modalSolicitarTroca(tipo, profOrigem, dia, codigo, ano, mes, mapaCodigos, todosProfissionais) {
  if (!profOrigem) { alert("Seu usuário não está vinculado a um profissional. Peça a um Administrador para vincular seu login em \"Usuários e Perfis\"."); return; }
  const infoCodigo = mapaCodigos[codigo];
  const periodo = periodoDoTurno(ano, mes, dia, infoCodigo);
  const outros = todosProfissionais.filter(p => p.id !== profOrigem.id);
  const entidade = tipo.entidadeId ? ESTADO.cacheEntidades.find(e=>e.id===tipo.entidadeId) : null;

  const div = document.createElement("div");
  div.className = "modal-fundo";
  div.innerHTML = `
    <div class="modal">
      <h3>🔄 Solicitar troca de plantão</h3>
      <p style="font-size:.85rem;background:var(--azul-cl);padding:10px 12px;border-radius:8px">
        <b>${escapeHtml(tipo.nome)}</b>${entidade?` — ${escapeHtml(entidade.nomeFantasia||entidade.razaoSocial)}`:""}<br>
        Dia ${fmtData2(dia)}/${fmtData2(mes)}/${ano} — ${escapeHtml(infoCodigo?.nome||codigo)} (${codigo})<br>
        De ${periodo.inicioTexto} até ${periodo.fimTexto}
      </p>
      <div class="campo"><label>Trocar com qual profissional?</label>
        <select id="tcDestino">
          <option value="">Selecione...</option>
          ${outros.map(p=>`<option value="${p.id}">${escapeHtml(p.nome)}</option>`).join("")}
        </select>
      </div>
      <div class="campo"><label>Motivo da troca *</label><textarea id="tcMotivo" rows="3" placeholder="Explique o motivo da solicitação"></textarea></div>
      <p style="font-size:.78rem;color:#6b7280">O colega escolhido recebe um e-mail para confirmar (SIM/NÃO), direto pelo próprio e-mail. Depois de confirmado, o Administrador e/ou Diretor Clínico precisam autorizar para a troca valer de fato na escala.</p>
      <div id="areaMsgTroca"></div>
      <div class="acoes">
        <button class="btn btn-secundario" id="mCancelar">Cancelar</button>
        <button class="btn btn-primario" id="mSalvar">Enviar solicitação</button>
      </div>
    </div>`;
  document.body.appendChild(div);
  div.querySelector("#mCancelar").addEventListener("click", () => div.remove());
  div.querySelector("#mSalvar").addEventListener("click", async () => {
    const destinoId = div.querySelector("#tcDestino").value;
    const motivo = div.querySelector("#tcMotivo").value.trim();
    if (!destinoId) { alert("Selecione o profissional para a troca."); return; }
    if (!motivo) { alert("Informe o motivo da troca."); return; }
    const profDestino = todosProfissionais.find(p=>p.id===destinoId);
    const btn = div.querySelector("#mSalvar"); btn.disabled = true; btn.textContent = "Enviando...";

    // Guarda tudo já "pronto" no próprio documento (nome, entidade, horários) para que o
    // e-mail e o link de confirmação funcionem mesmo sem o colega estar logado no sistema.
    const troca = {
      setorId: tipo.id, setorNome: tipo.nome, entidadeId: tipo.entidadeId||"",
      entidadeNome: entidade ? (entidade.nomeFantasia||entidade.razaoSocial) : "",
      entidadeNomeFantasia: entidade?.nomeFantasia || "",
      entidadeRazaoSocial: entidade?.razaoSocial || "",
      ano, mes, dia, codigo, codigoNome: infoCodigo?.nome||codigo,
      periodoInicioTexto: periodo.inicioTexto, periodoFimTexto: periodo.fimTexto,
      profissionalOrigemId: profOrigem.id, profissionalOrigemNome: profOrigem.nome, profissionalOrigemEmail: profOrigem.email||"",
      profissionalDestinoId: profDestino.id, profissionalDestinoNome: profDestino.nome, profissionalDestinoEmail: profDestino.email||"",
      motivo, status:"aguardando_destino",
      tokenDestino: gerarToken(),
      solicitadoPor: ESTADO.usuarioDoc.nome, solicitadoEm: Date.now(),
    };
    const ref = await db.collection("trocas").add(troca);
    troca.id = ref.id;

    if (troca.profissionalDestinoEmail) {
      await enviarEmail(troca.profissionalDestinoEmail, `Troca de Plantão — ${troca.profissionalOrigemNome} e ${troca.profissionalDestinoNome}`, montarCorpoEmailConfirmacaoDestino(troca));
    }

    div.remove();
    alert("Solicitação enviada! O colega vai receber um e-mail para confirmar (SIM/NÃO). Depois disso, o Administrador/Diretor Clínico serão avisados para autorizar.");
    renderTrocas();
  });
}

async function confirmarDestino(troca, aceitar) {
  if (!aceitar) {
    await db.collection("trocas").doc(troca.id).update({ status:"recusada_destino", respostaDestinoEm: Date.now() });
    await notificarRecusaDestino(troca);
    renderTrocas();
    return;
  }
  await db.collection("trocas").doc(troca.id).update({ status:"aguardando_aprovacao", respostaDestinoEm: Date.now() });
  await notificarConfirmacaoDestino(troca);
  renderTrocas();
}

async function decidirAprovacao(troca, autorizar) {
  if (!autorizar) {
    const motivoRecusa = prompt("Motivo da recusa (opcional):") || "";
    await db.collection("trocas").doc(troca.id).update({ status:"recusada_aprovacao", motivoRecusa, decididoPor: ESTADO.usuarioDoc.nome, decididoEm: Date.now() });
    troca.motivoRecusa = motivoRecusa;
    await enviarEmail(troca.profissionalOrigemEmail, "Troca de plantão negada", montarCorpoEmailResultadoFinal(troca, false));
    await enviarEmail(troca.profissionalDestinoEmail, "Troca de plantão negada", montarCorpoEmailResultadoFinal(troca, false));
    renderTrocas();
    return;
  }
  // Executa a troca de fato na escala: remove o código do profissional de origem e atribui ao destino
  const docIdOrigem = `${troca.setorId}_${troca.ano}_${troca.mes}_${troca.profissionalOrigemId}`;
  const docIdDestino = `${troca.setorId}_${troca.ano}_${troca.mes}_${troca.profissionalDestinoId}`;
  await db.collection("escalas").doc(docIdOrigem).set({ setor:troca.setorId, ano:troca.ano, mes:troca.mes, profissionalId:troca.profissionalOrigemId }, { merge:true });
  await db.collection("escalas").doc(docIdOrigem).update({ [`dias.${troca.dia}`]: firebase.firestore.FieldValue.delete() }).catch(()=>{});
  await db.collection("escalas").doc(docIdDestino).set({ setor:troca.setorId, ano:troca.ano, mes:troca.mes, profissionalId:troca.profissionalDestinoId }, { merge:true });
  await db.collection("escalas").doc(docIdDestino).set({ [`dias.${troca.dia}`]: troca.codigo }, { merge:true });
  await db.collection("historicoEscala").add({
    setorId: troca.setorId, setorNome: troca.setorNome, ano:troca.ano, mes:troca.mes, dia:troca.dia, codigo:troca.codigo,
    profissionalPrevistoId: troca.profissionalOrigemId, profissionalPrevistoNome: troca.profissionalOrigemNome,
    profissionalRealizadoId: troca.profissionalDestinoId, profissionalRealizadoNome: troca.profissionalDestinoNome,
    trocaId: troca.id, registradoEm: Date.now(),
  });

  await db.collection("trocas").doc(troca.id).update({ status:"aprovada", decididoPor: ESTADO.usuarioDoc.nome, decididoEm: Date.now() });
  await enviarEmail(troca.profissionalOrigemEmail, "Troca de plantão autorizada", montarCorpoEmailResultadoFinal(troca, true));
  await enviarEmail(troca.profissionalDestinoEmail, "Troca de plantão autorizada", montarCorpoEmailResultadoFinal(troca, true));
  renderTrocas();
}

function badgeStatusTroca(status) {
  const mapa = {
    aguardando_destino: ['badge-amarelo','⏳ Aguardando colega'],
    aguardando_aprovacao: ['badge-azul','⏳ Aguardando autorização'],
    aprovada: ['badge-verde','✅ Aprovada'],
    recusada_destino: ['badge-vermelho','❌ Recusada pelo colega'],
    recusada_aprovacao: ['badge-vermelho','❌ Negada na autorização'],
  };
  const [classe,texto] = mapa[status] || ['badge-cinza',status];
  return `<span class="badge ${classe}">${texto}</span>`;
}

function linhaTroca(t, mostrarAcoesDestino, mostrarAcoesAprovacao) {
  return `<div class="cartao" style="margin-bottom:10px">
    <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px">
      <div>
        <b>${escapeHtml(t.profissionalOrigemNome)}</b> → <b>${escapeHtml(t.profissionalDestinoNome)}</b><br>
        <small style="color:#6b7280">${escapeHtml(t.setorNome)}${t.entidadeNome?` — ${escapeHtml(t.entidadeNome)}`:""} • Dia ${fmtData2(t.dia)}/${fmtData2(t.mes)}/${t.ano} • ${escapeHtml(t.codigoNome||t.codigo)}</small><br>
        <small style="color:#6b7280">Motivo: ${escapeHtml(t.motivo)}</small>
      </div>
      <div style="text-align:right">${badgeStatusTroca(t.status)}</div>
    </div>
    ${mostrarAcoesDestino ? `<div class="acoes" style="justify-content:flex-start;margin-top:10px">
      <button class="btn btn-sucesso btnConfirmarDestino" data-id="${t.id}">✅ Confirmar (SIM)</button>
      <button class="btn btn-perigo btnRecusarDestino" data-id="${t.id}">❌ Recusar (NÃO)</button>
    </div>` : ""}
    ${mostrarAcoesAprovacao ? `<div class="acoes" style="justify-content:flex-start;margin-top:10px">
      <button class="btn btn-sucesso btnAutorizar" data-id="${t.id}">✅ Autorizar troca</button>
      <button class="btn btn-perigo btnNegar" data-id="${t.id}">❌ Negar</button>
    </div>` : ""}
  </div>`;
}

// ---- Link mágico: quando o colega clica em SIM/NÃO direto no e-mail, sem precisar logar ----
function mostrarResultadoLink(titulo, mensagem, sucesso) {
  $app.innerHTML = `
    <div class="tela-login">
      <div class="cartao-login" style="text-align:center">
        <h1>${sucesso ? "✅" : "⚠️"} ${escapeHtml(titulo)}</h1>
        <p class="sub" style="margin-top:10px">${escapeHtml(mensagem)}</p>
        <a class="btn btn-primario" style="display:inline-flex;margin-top:14px;text-decoration:none" href="${urlBaseApp()}">Ir para o sistema</a>
      </div>
    </div>`;
}

async function processarLinkConfirmacaoTroca() {
  $app.innerHTML = `<div class="tela-login"><div class="cartao-login"><h1>⏳ Processando...</h1><div class="sub">Só um instante.</div></div></div>`;
  const { id, token, resposta } = LINK_TROCA;
  if (!id || !token || (resposta !== "sim" && resposta !== "nao")) {
    mostrarResultadoLink("Link inválido", "Este link de confirmação de troca de plantão está incompleto ou incorreto.", false); return;
  }
  try {
    const ref = db.collection("trocas").doc(id);
    const snap = await ref.get();
    if (!snap.exists) { mostrarResultadoLink("Solicitação não encontrada", "Esta solicitação de troca não existe mais.", false); return; }
    const troca = { id, ...snap.data() };
    if (troca.status !== "aguardando_destino") {
      mostrarResultadoLink("Já respondido", "Esta solicitação já foi respondida anteriormente (ou não está mais pendente). Nenhuma ação foi necessária agora.", true); return;
    }
    if (troca.tokenDestino !== token) { mostrarResultadoLink("Link inválido", "O código de confirmação deste link não confere.", false); return; }

    if (resposta === "sim") {
      await ref.update({ status:"aguardando_aprovacao", respostaDestinoEm: Date.now(), tokenUsado: token });
      await notificarConfirmacaoDestino(troca);
      mostrarResultadoLink("Troca confirmada!", `Você confirmou que assume o plantão de ${troca.setorNome} do dia ${fmtData2(troca.dia)}/${fmtData2(troca.mes)}/${troca.ano}. O Administrador/Diretor Clínico foram avisados para autorizar a troca.`, true);
    } else {
      await ref.update({ status:"recusada_destino", respostaDestinoEm: Date.now(), tokenUsado: token });
      await notificarRecusaDestino(troca);
      mostrarResultadoLink("Troca recusada", "Você recusou a troca de plantão. O profissional solicitante foi avisado e pode tentar com outro colega.", true);
    }
  } catch (err) {
    mostrarResultadoLink("Não foi possível processar", "Ocorreu um erro ao registrar sua resposta: " + err.message, false);
  }
}

async function renderTrocas() {
  const vp = document.getElementById("viewport");
  vp.innerHTML = `<div class="cartao">Carregando...</div>`;
  const meuProfId = ESTADO.usuarioDoc.profissionalId;
  const podeAprovar = podeEditarTela("trocas");
  const snap = await db.collection("trocas").orderBy("solicitadoEm","desc").limit(200).get();
  const todas = snap.docs.map(d => ({ id:d.id, ...d.data() }));

  const aguardandoMinhaResposta = meuProfId ? todas.filter(t => t.profissionalDestinoId===meuProfId && t.status==="aguardando_destino") : [];
  const aguardandoAutorizacao = podeAprovar ? todas.filter(t => t.status==="aguardando_aprovacao") : [];
  const minhas = meuProfId ? todas.filter(t => t.profissionalOrigemId===meuProfId || t.profissionalDestinoId===meuProfId) : [];
  const todasParaGestor = podeAprovar ? todas : [];

  vp.innerHTML = `
    <div class="cabecalho-pagina"><div><h2>Trocas de Plantão</h2><div class="desc">Solicite, confirme e acompanhe trocas de plantão entre profissionais da mesma escala.</div></div></div>

    ${aguardandoMinhaResposta.length ? `<h3>🔔 Aguardando sua resposta</h3>${aguardandoMinhaResposta.map(t=>linhaTroca(t,true,false)).join("")}` : ""}
    ${aguardandoAutorizacao.length ? `<h3>🗂️ Aguardando sua autorização</h3>${aguardandoAutorizacao.map(t=>linhaTroca(t,false,true)).join("")}` : ""}

    <h3>${meuProfId ? "Minhas solicitações" : "Histórico"}</h3>
    ${(meuProfId ? minhas : todasParaGestor).length ? (meuProfId?minhas:todasParaGestor).map(t=>linhaTroca(t,false,false)).join("") : `<div class="cartao">Nenhuma solicitação de troca ainda. ${meuProfId ? "Para solicitar, abra uma das suas escalas e clique no seu próprio plantão." : ""}</div>`}
  `;

  vp.querySelectorAll(".btnConfirmarDestino").forEach(b=>b.addEventListener("click",()=>confirmarDestino(todas.find(t=>t.id===b.dataset.id), true)));
  vp.querySelectorAll(".btnRecusarDestino").forEach(b=>b.addEventListener("click",()=>confirmarDestino(todas.find(t=>t.id===b.dataset.id), false)));
  vp.querySelectorAll(".btnAutorizar").forEach(b=>b.addEventListener("click",()=>{ if(confirm("Autorizar esta troca? A escala será atualizada automaticamente.")) decidirAprovacao(todas.find(t=>t.id===b.dataset.id), true); }));
  vp.querySelectorAll(".btnNegar").forEach(b=>b.addEventListener("click",()=>decidirAprovacao(todas.find(t=>t.id===b.dataset.id), false)));
}

function calcularHorasProfissional(diasObj, mapaCodigos) {
  let total = 0;
  Object.values(diasObj || {}).forEach(cod => { total += (mapaCodigos[cod]?.horas || 0); });
  return total;
}

async function salvarCelulaEscala(setor, ano, mes, profissionalId, dia, codigo) {
  const docId = `${setor}_${ano}_${mes}_${profissionalId}`;
  const ref = db.collection("escalas").doc(docId);
  const campo = `dias.${dia}`;
  if (codigo) {
    await ref.set({ setor, ano, mes, profissionalId }, { merge:true });
    await ref.set({ [campo]: codigo }, { merge:true });
  } else {
    await ref.set({ setor, ano, mes, profissionalId }, { merge:true });
    await ref.update({ [campo]: firebase.firestore.FieldValue.delete() }).catch(()=>{});
  }
}

// -------------------------------------------------------------------------
// 10. DASHBOARD
// -------------------------------------------------------------------------
let graficosAtivos = [];
function destruirGraficos() { graficosAtivos.forEach(g => g.destroy()); graficosAtivos = []; }

async function renderDashboard() {
  const vp = document.getElementById("viewport");
  vp.innerHTML = `<div class="cartao">Carregando painel...</div>`;
  const hoje = new Date();
  const mes = hoje.getMonth()+1, ano = hoje.getFullYear();
  const setorSel = ESTADO.cacheTiposEscala.find(t=>t.id==="plantoes") ? "plantoes" : (ESTADO.cacheTiposEscala[0]?.id);

  vp.innerHTML = `
    <div class="cabecalho-pagina">
      <div><h2>Painel Geral</h2><div class="desc">Resumo de ${MESES[mes-1]} de ${ano}</div></div>
      <select id="selSetorDash">${ESTADO.cacheTiposEscala.map(t=>`<option value="${t.id}" ${t.id===setorSel?"selected":""}>${escapeHtml(t.nome)}</option>`).join("")}</select>
    </div>
    <div id="areaDash"></div>`;

  document.getElementById("selSetorDash").addEventListener("change", e => montarDashboard(e.target.value, mes, ano));
  montarDashboard(setorSel, mes, ano);
}

async function montarDashboard(setorId, mes, ano) {
  const area = document.getElementById("areaDash");
  if (!setorId) { area.innerHTML = `<div class="cartao">Crie um tipo de escala primeiro.</div>`; return; }
  area.innerHTML = `<div class="cartao">Carregando...</div>`;
  const tipo = ESTADO.cacheTiposEscala.find(t=>t.id===setorId);
  const mapaCodigos = {}; (tipo.codigos||[]).forEach(c => mapaCodigos[c.codigo]=c);
  const profissionais = await carregarProfissionais();
  const snap = await db.collection("escalas").where("setor","==",setorId).where("ano","==",ano).where("mes","==",mes).get();
  const escalas = snap.docs.map(d => d.data());

  let totalHoras = 0, valorEstimado = 0;
  const porProfissional = {}; const porCodigo = {};
  escalas.forEach(doc => {
    const prof = profissionais.find(p=>p.id===doc.profissionalId);
    const nome = prof?.nome || "?";
    const categoria = prof?.categoria || "Médico";
    const valorHora = buscarValorHora(setorId, categoria);
    Object.values(doc.dias || {}).forEach(cod => {
      const h = mapaCodigos[cod]?.horas || 0;
      totalHoras += h;
      valorEstimado += h * valorHora;
      porProfissional[nome] = (porProfissional[nome]||0) + h;
      porCodigo[cod] = (porCodigo[cod]||0) + 1;
    });
  });

  area.innerHTML = `
    <div class="grade-cartoes">
      <div class="kpi"><div class="valor">${profissionais.filter(p=>p.ativo!==false).length}</div><div class="rotulo">Profissionais ativos</div></div>
      <div class="kpi k-verde"><div class="valor">${totalHoras}h</div><div class="rotulo">Total de horas no mês</div></div>
      <div class="kpi k-amarelo"><div class="valor">${Object.keys(porProfissional).length}</div><div class="rotulo">Profissionais escalados</div></div>
      <div class="kpi k-vermelho"><div class="valor">${fmtMoeda(valorEstimado)}</div><div class="rotulo">Valor estimado a pagar</div></div>
    </div>
    <div class="grafico-grid">
      <div class="cartao"><h3>Horas por profissional</h3><canvas id="graf1"></canvas></div>
      <div class="cartao"><h3>Distribuição por código</h3><canvas id="graf2"></canvas></div>
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
    data: { labels: Object.keys(porCodigo).map(c=>`${c} - ${mapaCodigos[c]?.nome||c}`), datasets:[{ data:Object.values(porCodigo), backgroundColor: Object.keys(porCodigo).map(c=>mapaCodigos[c]?.cor||"#999") }] },
    options: { responsive:true }
  }));

  const meses6 = [];
  for (let i=5;i>=0;i--) { const d = new Date(ano, mes-1-i, 1); meses6.push({ mes:d.getMonth()+1, ano:d.getFullYear(), label:`${MESES[d.getMonth()].slice(0,3)}/${d.getFullYear()}` }); }
  const totaisMensais = [];
  for (const m of meses6) {
    const s = await db.collection("escalas").where("setor","==",setorId).where("ano","==",m.ano).where("mes","==",m.mes).get();
    let h = 0; s.docs.forEach(d => Object.values(d.data().dias||{}).forEach(c => h += (mapaCodigos[c]?.horas||0)));
    totaisMensais.push(h);
  }
  graficosAtivos.push(new Chart(document.getElementById("graf3"), {
    type: "line",
    data: { labels: meses6.map(m=>m.label), datasets:[{ label:"Horas totais", data: totaisMensais, borderColor:"#1e8e5a", backgroundColor:"rgba(30,142,90,.15)", fill:true, tension:.3 }] },
    options: { responsive:true }
  }));
}

// -------------------------------------------------------------------------
// 10b. CONSULTAR ESCALAS (visualização somente-leitura, em calendário, para qualquer usuário aprovado)
// -------------------------------------------------------------------------
let ESTADO_CONSULTA = { mes: new Date().getMonth()+1, ano: new Date().getFullYear(), setoresIds: [], somenteMeus: false };

async function renderConsultarEscalas() {
  const vp = document.getElementById("viewport");
  if (!ESTADO_CONSULTA.setoresIds.length) ESTADO_CONSULTA.setoresIds = ESTADO.cacheTiposEscala.map(t=>t.id);
  const meuProfId = ESTADO.usuarioDoc.profissionalId;

  vp.innerHTML = `
    <div class="cabecalho-pagina">
      <div><h2>Consultar Escalas</h2><div class="desc">Visualização somente leitura, no formato de calendário. Qualquer pessoa cadastrada pode consultar.</div></div>
      <button class="btn btn-secundario" id="btnImprimirCalendario">🖨️ Imprimir</button>
    </div>
    <div class="barra-ferramentas">
      <button class="btn btn-secundario" id="btnMesAnterior">‹</button>
      <b id="rotuloMesCalendario" style="min-width:150px;text-align:center;display:inline-block">${MESES[ESTADO_CONSULTA.mes-1]} ${ESTADO_CONSULTA.ano}</b>
      <button class="btn btn-secundario" id="btnMesProximo">›</button>
      <select id="selTiposCalendario" multiple size="3" style="min-width:220px">
        ${ESTADO.cacheTiposEscala.map(t=>`<option value="${t.id}" ${ESTADO_CONSULTA.setoresIds.includes(t.id)?"selected":""}>${escapeHtml(t.nome)}</option>`).join("")}
      </select>
      ${meuProfId ? `
        <button class="btn ${!ESTADO_CONSULTA.somenteMeus?"btn-primario":"btn-secundario"}" id="btnVerTodos">👥 Escala completa</button>
        <button class="btn ${ESTADO_CONSULTA.somenteMeus?"btn-primario":"btn-secundario"}" id="btnVerMeus">👤 Só meus plantões</button>
      ` : ""}
    </div>
    <div id="areaCalendario" class="cartao">Carregando...</div>`;

  document.getElementById("btnImprimirCalendario").addEventListener("click", () => window.print());
  document.getElementById("btnMesAnterior").addEventListener("click", () => { ESTADO_CONSULTA.mes--; if (ESTADO_CONSULTA.mes<1){ESTADO_CONSULTA.mes=12;ESTADO_CONSULTA.ano--;} renderConsultarEscalas(); });
  document.getElementById("btnMesProximo").addEventListener("click", () => { ESTADO_CONSULTA.mes++; if (ESTADO_CONSULTA.mes>12){ESTADO_CONSULTA.mes=1;ESTADO_CONSULTA.ano++;} renderConsultarEscalas(); });
  document.getElementById("selTiposCalendario").addEventListener("change", (e) => {
    ESTADO_CONSULTA.setoresIds = [...e.target.selectedOptions].map(o=>o.value);
    montarCalendario();
  });
  document.getElementById("btnVerTodos")?.addEventListener("click", () => { ESTADO_CONSULTA.somenteMeus=false; renderConsultarEscalas(); });
  document.getElementById("btnVerMeus")?.addEventListener("click", () => { ESTADO_CONSULTA.somenteMeus=true; renderConsultarEscalas(); });

  montarCalendario();
}

async function montarCalendario() {
  const area = document.getElementById("areaCalendario");
  area.innerHTML = "Carregando...";
  const { mes, ano, setoresIds, somenteMeus } = ESTADO_CONSULTA;
  const meuProfId = ESTADO.usuarioDoc.profissionalId;
  const profissionais = await carregarProfissionais();
  const totalDias = diasNoMes(ano, mes);

  const porDia = {}; // { dia: [ {profNome, corBg, corTxt, texto, horario} ] }
  for (let d=1; d<=totalDias; d++) porDia[d] = [];

  for (const setorId of (setoresIds.length ? setoresIds : ESTADO.cacheTiposEscala.map(t=>t.id))) {
    const tipo = ESTADO.cacheTiposEscala.find(t=>t.id===setorId);
    if (!tipo) continue;
    const mapaCodigos = {}; (tipo.codigos||[]).forEach(c=>mapaCodigos[c.codigo]=c);
    const snap = await db.collection("escalas").where("setor","==",setorId).where("ano","==",ano).where("mes","==",mes).get();
    snap.docs.forEach(docSnap => {
      const doc = docSnap.data();
      if (somenteMeus && doc.profissionalId !== meuProfId) return;
      const prof = profissionais.find(p=>p.id===doc.profissionalId);
      Object.entries(doc.dias||{}).forEach(([dia,codigo]) => {
        const info = mapaCodigos[codigo]; if (!info) return;
        porDia[+dia].push({
          nome: prof?.nome || "?", setor: tipo.nome,
          cor: info.cor, corTxt: corTexto(info.cor),
          horario: `${info.inicio||""}`,
        });
      });
    });
  }

  const primeiroDiaSemana = diaDaSemana(ano, mes, 1);
  let celulas = [];
  for (let i=0;i<primeiroDiaSemana;i++) celulas.push(null);
  for (let d=1; d<=totalDias; d++) celulas.push(d);
  while (celulas.length % 7 !== 0) celulas.push(null);
  const semanas = []; for (let i=0;i<celulas.length;i+=7) semanas.push(celulas.slice(i,i+7));

  area.innerHTML = `
    <table class="calendario-consulta">
      <thead><tr>${["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"].map(d=>`<th>${d}</th>`).join("")}</tr></thead>
      <tbody>
        ${semanas.map(semana => `<tr>${semana.map(d => {
          if (!d) return `<td class="dia-vazio"></td>`;
          const entradas = porDia[d]||[];
          return `<td><div class="num-dia">${d}</div>${entradas.map(e=>`
            <div class="entrada-cal" style="background:${e.cor};color:${e.corTxt}" title="${escapeHtml(e.setor)}">
              ${escapeHtml(e.nome)}${e.horario?` <small>${e.horario}</small>`:""}
            </div>`).join("") || ""}</td>`;
        }).join("")}</tr>`).join("")}
      </tbody>
    </table>
    ${!Object.values(porDia).some(l=>l.length) ? `<p style="margin-top:10px;color:#6b7280">Nenhum plantão encontrado para os filtros selecionados.</p>` : ""}`;
}

// -------------------------------------------------------------------------
// 10c. RELATÓRIOS (catálogo completo, por período livre) + exportação
// -------------------------------------------------------------------------
const CATALOGO_RELATORIOS = [
  { id:"afastamento",        nome:"Afastamento" },
  { id:"faltas",              nome:"Faltas" },
  { id:"dados-bancarios",     nome:"Dados Bancários" },
  { id:"escalas",             nome:"Escalas" },
  { id:"extrapolamento",      nome:"Extrapolamento de Horas (Mensal/Semanal)" },
  { id:"financeiro",          nome:"Financeiro" },
  { id:"financeiro-detalhado",nome:"Financeiro (Individual e Consolidado)" },
  { id:"financeiro-sintetico",nome:"Financeiro Sintético" },
  { id:"financeiro-valor-hora",nome:"Financeiro Valor por Hora" },
  { id:"grupos-usuarios",     nome:"Grupos dos Usuários" },
  { id:"horas-trabalhadas",   nome:"Horas Trabalhadas (Individual e Consolidado)" },
  { id:"plantoes",            nome:"Plantões" },
  { id:"plantoes-previsto-realizado", nome:"Plantões (Previsto x Realizados)" },
  { id:"plantoes-confirmados",nome:"Plantões Confirmados" },
  { id:"profissionais",       nome:"Profissionais" },
  { id:"qtd-plantoes",        nome:"Quantidade de Plantões" },
  { id:"qtd-plantoes-hora",   nome:"Quantidade de Plantões por Hora" },
  { id:"trocas-passagens",    nome:"Troca e Passagens entre Profissionais" },
];

function cabecalhoRelatorioRangeHtml(titulo, dataInicio, dataFim) {
  return `<div style="text-align:center;margin-bottom:14px">
    <h3 style="margin:0">SECRETARIA MUNICIPAL DE SAÚDE DE JABORANDI</h3>
    <div>${escapeHtml(titulo)}${dataInicio?` — ${fmtDataBR(dataInicio)} até ${fmtDataBR(dataFim)}`:""}</div>
  </div>`;
}
function fmtDataBR(iso) { if (!iso) return ""; const [a,m,d] = iso.split("-"); return `${d}/${m}/${a}`; }

function montarTabelaRelatorio(area, titulo, dataInicio, dataFim, colunas, linhas, linhaTotal) {
  area.innerHTML = cabecalhoRelatorioRangeHtml(titulo, dataInicio, dataFim) + `
    <table class="tabela">
      <thead><tr>${colunas.map(c=>`<th>${escapeHtml(c)}</th>`).join("")}</tr></thead>
      <tbody>
        ${linhas.length ? linhas.map(l=>`<tr>${l.map(v=>`<td>${escapeHtml(v)}</td>`).join("")}</tr>`).join("")
          : `<tr><td colspan="${colunas.length}">Nenhum dado encontrado para o período/filtros selecionados.</td></tr>`}
      </tbody>
      ${linhaTotal ? `<tfoot><tr>${linhaTotal.map(v=>`<td style="font-weight:700">${escapeHtml(v)}</td>`).join("")}</tr></tfoot>` : ""}
    </table>
    <p style="font-size:.72rem;color:#9ca3af;margin-top:10px">Gerado em ${new Date().toLocaleString("pt-BR")}</p>`;
  ESTADO.ultimoRelatorio = { titulo: titulo.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g,"_"), colunas, linhas };
}

// Busca todos os plantões (dias preenchidos) no período, cruzando meses, para os setores informados.
async function buscarPlantoesPeriodo(setorIds, dataInicioStr, dataFimStr) {
  const dataInicio = new Date(dataInicioStr+"T00:00:00");
  const dataFim = new Date(dataFimStr+"T23:59:59");
  const resultado = [];
  let cursor = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), 1);
  while (cursor <= dataFim) {
    const ano = cursor.getFullYear(), mes = cursor.getMonth()+1;
    let query = db.collection("escalas").where("ano","==",ano).where("mes","==",mes);
    const snap = await query.get();
    snap.docs.forEach(d => {
      const doc = d.data();
      if (setorIds.length && !setorIds.includes(doc.setor)) return;
      Object.entries(doc.dias||{}).forEach(([dia,codigo]) => {
        const data = new Date(ano, mes-1, +dia);
        if (data >= dataInicio && data <= dataFim) {
          resultado.push({ setorId:doc.setor, ano, mes, dia:+dia, data, profissionalId:doc.profissionalId, codigo });
        }
      });
    });
    cursor.setMonth(cursor.getMonth()+1);
  }
  resultado.sort((a,b)=>a.data-b.data);
  return resultado;
}

function mapaCodigosDoSetor(setorId) {
  const tipo = ESTADO.cacheTiposEscala.find(t=>t.id===setorId);
  const mapa = {}; (tipo?.codigos||[]).forEach(c=>mapa[c.codigo]=c);
  return mapa;
}

async function renderRelatorios() {
  const vp = document.getElementById("viewport");
  const profissionais = await carregarProfissionais();
  await carregarEntidades();
  const hoje = new Date();
  const primeiroDiaMes = `${hoje.getFullYear()}-${fmtData2(hoje.getMonth()+1)}-01`;
  const hojeStr = `${hoje.getFullYear()}-${fmtData2(hoje.getMonth()+1)}-${fmtData2(hoje.getDate())}`;

  vp.innerHTML = `
    <div class="cabecalho-pagina"><div><h2>Relatórios</h2><div class="desc">Catálogo completo de relatórios com base nos dados do sistema.</div></div></div>
    <div class="barra-ferramentas">
      <select id="catRelatorio" style="min-width:260px">
        ${CATALOGO_RELATORIOS.map(r=>`<option value="${r.id}">${r.nome}</option>`).join("")}
      </select>
      <select id="catSetores" multiple size="1" style="min-width:170px" title="Setor(es) — deixe sem marcar nenhum para incluir todos">
        ${ESTADO.cacheTiposEscala.map(t=>`<option value="${t.id}">${escapeHtml(t.nome)}</option>`).join("")}
      </select>
      <select id="catProfissional" style="min-width:170px">
        <option value="">Todos os profissionais</option>
        ${profissionais.map(p=>`<option value="${p.id}">${escapeHtml(p.nome)}</option>`).join("")}
      </select>
    </div>
    <div class="barra-ferramentas">
      <label style="font-size:.8rem">De <input type="date" id="catInicio" value="${primeiroDiaMes}"></label>
      <label style="font-size:.8rem">Até <input type="date" id="catFim" value="${hojeStr}"></label>
      <label style="font-size:.8rem"><input type="checkbox" id="catBancarios"> Incluir dados bancários</label>
      <button class="btn btn-secundario" id="btnGerarCat">Gerar</button>
    </div>
    <div class="barra-ferramentas">
      <button class="btn btn-primario" id="btnImprimirCat">🖨️ Imprimir / PDF</button>
      <button class="btn btn-sucesso" id="btnExcelCat">📊 Exportar Excel (.xlsx)</button>
      <button class="btn btn-secundario" id="btnCsvCat">📄 Exportar CSV</button>
    </div>
    <div id="areaRelatorio" class="cartao">Escolha o relatório, os filtros e clique em "Gerar".</div>`;

  document.getElementById("btnImprimirCat").addEventListener("click", () => window.print());
  document.getElementById("btnExcelCat").addEventListener("click", exportarExcel);
  document.getElementById("btnCsvCat").addEventListener("click", exportarCsv);
  document.getElementById("btnGerarCat").addEventListener("click", gerarRelatorioCatalogo);
}

async function gerarRelatorioCatalogo() {
  const area = document.getElementById("areaRelatorio");
  area.innerHTML = "Calculando...";
  const tipoRel = document.getElementById("catRelatorio").value;
  const setoresSelecionados = [...document.getElementById("catSetores").selectedOptions].map(o=>o.value);
  const setorIds = setoresSelecionados.length ? setoresSelecionados : ESTADO.cacheTiposEscala.map(t=>t.id);
  const profFiltroId = document.getElementById("catProfissional").value;
  const dataInicio = document.getElementById("catInicio").value;
  const dataFim = document.getElementById("catFim").value;
  const incluirBancarios = document.getElementById("catBancarios").checked;
  const profissionais = await carregarProfissionais();
  const nomeSetorFn = id => ESTADO.cacheTiposEscala.find(t=>t.id===id)?.nome || id;

  const FUNCOES = {
    "afastamento": relAfastamentosOuFaltas, "faltas": relAfastamentosOuFaltas,
    "dados-bancarios": relDadosBancarios,
    "escalas": relEscalas,
    "extrapolamento": relExtrapolamento,
    "financeiro": relFinanceiro,
    "financeiro-detalhado": relFinanceiroDetalhado,
    "financeiro-sintetico": relFinanceiroSintetico,
    "financeiro-valor-hora": relFinanceiroValorHora,
    "grupos-usuarios": relGruposUsuarios,
    "horas-trabalhadas": relHorasTrabalhadas,
    "plantoes": relPlantoes,
    "plantoes-previsto-realizado": relPlantoesPrevistoRealizado,
    "plantoes-confirmados": relPlantoesConfirmados,
    "profissionais": relProfissionaisRel,
    "qtd-plantoes": relQtdPlantoes,
    "qtd-plantoes-hora": relQtdPlantoesPorHora,
    "trocas-passagens": relTrocasPassagens,
  };
  const ctx = { setorIds, profFiltroId, dataInicio, dataFim, incluirBancarios, profissionais, nomeSetorFn, area, tipoRel };
  try { await FUNCOES[tipoRel](ctx); }
  catch (err) { area.innerHTML = `<p style="color:#c0392b">Erro ao gerar relatório: ${escapeHtml(err.message)}</p>`; console.error(err); }
}

// ---- 1) Afastamento / Faltas ----
async function relAfastamentosOuFaltas(ctx) {
  const nomeRel = ctx.tipoRel === "faltas" ? "Faltas" : "Afastamento";
  const snap = await db.collection("afastamentos").get();
  let linhas = snap.docs.map(d=>d.data())
    .filter(a => a.dataInicio <= ctx.dataFim && a.dataFim >= ctx.dataInicio)
    .filter(a => ctx.tipoRel === "faltas" ? a.tipo === "Falta" : true)
    .filter(a => !ctx.profFiltroId || a.profissionalId === ctx.profFiltroId);
  linhas.sort((a,b)=>a.dataInicio.localeCompare(b.dataInicio));
  montarTabelaRelatorio(ctx.area, nomeRel, ctx.dataInicio, ctx.dataFim,
    ["Profissional","Tipo","Início","Fim","Motivo"],
    linhas.map(a=>[a.profissionalNome, a.tipo, fmtDataBR(a.dataInicio), fmtDataBR(a.dataFim), a.motivo||"-"]));
}

// ---- 2) Dados Bancários ----
async function relDadosBancarios(ctx) {
  let lista = ctx.profissionais.filter(p => !ctx.profFiltroId || p.id === ctx.profFiltroId);
  montarTabelaRelatorio(ctx.area, "Dados Bancários", null, null,
    ["Profissional","CPF/CNPJ","Banco","Agência","Conta","PIX","Emite N.F."],
    lista.map(p=>[p.nome, p.cpf||"-", p.nomeAgencia||"-", p.agencia||"-", p.conta||"-", p.pix||"-", p.emiteNF?"SIM":"NÃO"]));
}

// ---- 3) Escalas (listagem cronológica, igual à grade) ----
async function relEscalas(ctx) {
  const plantoes = await buscarPlantoesPeriodo(ctx.setorIds, ctx.dataInicio, ctx.dataFim);
  const filtrados = plantoes.filter(p => !ctx.profFiltroId || p.profissionalId === ctx.profFiltroId);
  const linhas = filtrados.map(p => {
    const prof = ctx.profissionais.find(x=>x.id===p.profissionalId);
    const info = mapaCodigosDoSetor(p.setorId)[p.codigo];
    return [fmtData2(p.dia)+"/"+fmtData2(p.mes)+"/"+p.ano, DIAS_SEMANA[p.data.getDay()], ctx.nomeSetorFn(p.setorId), prof?.nome||"?", p.codigo, info?.nome||"-", info?.inicio||"-", (info?.horas||0)+"h"];
  });
  montarTabelaRelatorio(ctx.area, "Escalas", ctx.dataInicio, ctx.dataFim,
    ["Data","Dia","Escala","Profissional","Código","Turno","Início","Duração"], linhas);
}

// ---- 4) Extrapolamento de horas mensais/semanais ----
async function relExtrapolamento(ctx) {
  const plantoes = await buscarPlantoesPeriodo(ctx.setorIds, ctx.dataInicio, ctx.dataFim);
  const porProfissional = {};
  plantoes.forEach(p => {
    const info = mapaCodigosDoSetor(p.setorId)[p.codigo]; if (!info) return;
    (porProfissional[p.profissionalId] ||= { horasMes:0, semanas:{} });
    porProfissional[p.profissionalId].horasMes += info.horas;
    const inicioSemana = new Date(p.data); inicioSemana.setDate(p.data.getDate() - p.data.getDay());
    const chaveSemana = inicioSemana.toISOString().slice(0,10);
    porProfissional[p.profissionalId].semanas[chaveSemana] = (porProfissional[p.profissionalId].semanas[chaveSemana]||0) + info.horas;
  });
  const linhas = [];
  Object.entries(porProfissional).forEach(([profId,dados]) => {
    if (ctx.profFiltroId && profId !== ctx.profFiltroId) return;
    const prof = ctx.profissionais.find(p=>p.id===profId); if (!prof) return;
    const limiteMensal = prof.limiteHorasMensais ?? 220;
    const limiteSemanal = prof.limiteHorasSemanais ?? 44;
    if (dados.horasMes > limiteMensal) linhas.push([prof.nome, "Mensal", dados.horasMes+"h", limiteMensal+"h", (dados.horasMes-limiteMensal)+"h"]);
    Object.entries(dados.semanas).forEach(([semana,h]) => {
      if (h > limiteSemanal) linhas.push([prof.nome, `Semana de ${fmtDataBR(semana)}`, h+"h", limiteSemanal+"h", (h-limiteSemanal)+"h"]);
    });
  });
  montarTabelaRelatorio(ctx.area, "Extrapolamento de Horas (Mensal/Semanal)", ctx.dataInicio, ctx.dataFim,
    ["Profissional","Período","Horas trabalhadas","Limite","Excedente"], linhas);
}

function calcularValorPeriodo(plantoes, profissionais) {
  const porProf = {};
  plantoes.forEach(p => {
    const info = mapaCodigosDoSetor(p.setorId)[p.codigo]; if (!info) return;
    const prof = profissionais.find(x=>x.id===p.profissionalId); if (!prof) return;
    const valorHora = buscarValorHora(p.setorId, prof.categoria||"Médico");
    (porProf[p.profissionalId] ||= { prof, horas:0, valor:0, plantoes:0 });
    porProf[p.profissionalId].horas += info.horas;
    porProf[p.profissionalId].valor += info.horas*valorHora;
    porProf[p.profissionalId].plantoes += 1;
  });
  return porProf;
}

// ---- 5) Financeiro (resumo) ----
async function relFinanceiro(ctx) {
  const plantoes = await buscarPlantoesPeriodo(ctx.setorIds, ctx.dataInicio, ctx.dataFim);
  const porProf = calcularValorPeriodo(plantoes, ctx.profissionais);
  let linhas = Object.values(porProf).filter(l => !ctx.profFiltroId || l.prof.id===ctx.profFiltroId);
  const colunas = ["Profissional","Categoria","Plantões","Horas","Total a Pagar"];
  if (ctx.incluirBancarios) colunas.push("PIX","Banco");
  const linhasFmt = linhas.map(l => {
    const base = [l.prof.nome, l.prof.categoria||"Médico", l.plantoes, l.horas+"h", fmtMoeda(l.valor)];
    if (ctx.incluirBancarios) base.push(l.prof.pix||"-", l.prof.nomeAgencia||"-");
    return base;
  });
  const totalGeral = linhas.reduce((s,l)=>s+l.valor,0);
  montarTabelaRelatorio(ctx.area, "Financeiro", ctx.dataInicio, ctx.dataFim, colunas, linhasFmt,
    [ "TOTAL GERAL", "", "", "", fmtMoeda(totalGeral), ...(ctx.incluirBancarios?["",""]:[]) ]);
}

// ---- 6) Financeiro (Individual e Consolidado) ----
async function relFinanceiroDetalhado(ctx) {
  const plantoes = await buscarPlantoesPeriodo(ctx.setorIds, ctx.dataInicio, ctx.dataFim);
  const filtrados = plantoes.filter(p => !ctx.profFiltroId || p.profissionalId === ctx.profFiltroId);
  const porProf = {};
  filtrados.forEach(p => {
    const info = mapaCodigosDoSetor(p.setorId)[p.codigo]; if (!info) return;
    const prof = ctx.profissionais.find(x=>x.id===p.profissionalId); if (!prof) return;
    const valorHora = buscarValorHora(p.setorId, prof.categoria||"Médico");
    (porProf[p.profissionalId] ||= { prof, itens:[], totalHoras:0, totalValor:0 });
    const valor = info.horas*valorHora;
    porProf[p.profissionalId].itens.push([fmtData2(p.dia)+"/"+fmtData2(p.mes)+"/"+p.ano, ctx.nomeSetorFn(p.setorId), p.codigo, info.horas+"h", fmtMoeda(valorHora), fmtMoeda(valor)]);
    porProf[p.profissionalId].totalHoras += info.horas;
    porProf[p.profissionalId].totalValor += valor;
  });
  const linhas = [];
  let totalGeral = 0;
  Object.values(porProf).forEach(dados => {
    linhas.push([`— ${dados.prof.nome} (${dados.prof.categoria||"Médico"}) —`,"","","","",""]);
    dados.itens.forEach(i => linhas.push(i));
    linhas.push([`Subtotal ${dados.prof.nome}`,"","",dados.totalHoras+"h","",fmtMoeda(dados.totalValor)]);
    totalGeral += dados.totalValor;
  });
  montarTabelaRelatorio(ctx.area, "Financeiro (Individual e Consolidado)", ctx.dataInicio, ctx.dataFim,
    ["Data / Profissional","Escala","Código","Horas","Valor/Hora","Valor"], linhas,
    ["TOTAL CONSOLIDADO","","","","",fmtMoeda(totalGeral)]);
}

// ---- 7) Financeiro Sintético ----
async function relFinanceiroSintetico(ctx) {
  const plantoes = await buscarPlantoesPeriodo(ctx.setorIds, ctx.dataInicio, ctx.dataFim);
  const porProf = calcularValorPeriodo(plantoes, ctx.profissionais);
  let linhas = Object.values(porProf).filter(l => !ctx.profFiltroId || l.prof.id===ctx.profFiltroId);
  const totalGeral = linhas.reduce((s,l)=>s+l.valor,0);
  montarTabelaRelatorio(ctx.area, "Financeiro Sintético", ctx.dataInicio, ctx.dataFim,
    ["Profissional","Total a Pagar"], linhas.map(l=>[l.prof.nome, fmtMoeda(l.valor)]),
    ["TOTAL GERAL", fmtMoeda(totalGeral)]);
}

// ---- 8) Financeiro Valor por Hora (tabela de valores configurados) ----
async function relFinanceiroValorHora(ctx) {
  await recarregarValoresPlantao();
  const linhas = ESTADO.cacheValoresPlantao
    .filter(v => !ctx.setorIds.length || v.setorId==="todos" || ctx.setorIds.includes(v.setorId))
    .map(v => [v.descricao, v.setorId==="todos"?"Todos os tipos":ctx.nomeSetorFn(v.setorId), v.categoria, fmtMoeda(v.valorHora)]);
  montarTabelaRelatorio(ctx.area, "Financeiro Valor por Hora", null, null,
    ["Descrição","Tipo de Escala","Categoria","Valor/Hora"], linhas);
}

// ---- 9) Grupos dos Usuários ----
async function relGruposUsuarios(ctx) {
  await recarregarPerfis();
  const snap = await db.collection("usuarios").get();
  const usuarios = snap.docs.map(d=>d.data());
  const linhas = [];
  ESTADO.cachePerfis.forEach(perfil => {
    const doGrupo = usuarios.filter(u=>u.perfil===perfil.id);
    linhas.push([`— ${perfil.nome} (${doGrupo.length}) —`,"",""]);
    doGrupo.forEach(u => linhas.push([u.nome, u.email, u.ativo?"Ativo":"Pendente/Bloqueado"]));
  });
  montarTabelaRelatorio(ctx.area, "Grupos dos Usuários", null, null, ["Nome / Grupo","E-mail","Status"], linhas);
}

// ---- 10) Horas Trabalhadas (Individual e Consolidado) ----
async function relHorasTrabalhadas(ctx) {
  const plantoes = await buscarPlantoesPeriodo(ctx.setorIds, ctx.dataInicio, ctx.dataFim);
  const filtrados = plantoes.filter(p => !ctx.profFiltroId || p.profissionalId === ctx.profFiltroId);
  const porProf = {};
  filtrados.forEach(p => {
    const info = mapaCodigosDoSetor(p.setorId)[p.codigo]; if (!info) return;
    const prof = ctx.profissionais.find(x=>x.id===p.profissionalId); if (!prof) return;
    (porProf[p.profissionalId] ||= { prof, itens:[], totalHoras:0 });
    porProf[p.profissionalId].itens.push([fmtData2(p.dia)+"/"+fmtData2(p.mes)+"/"+p.ano, ctx.nomeSetorFn(p.setorId), p.codigo, info.horas+"h"]);
    porProf[p.profissionalId].totalHoras += info.horas;
  });
  const linhas = []; let totalGeral = 0;
  Object.values(porProf).forEach(dados => {
    linhas.push([`— ${dados.prof.nome} —`,"","",""]);
    dados.itens.forEach(i=>linhas.push(i));
    linhas.push([`Subtotal ${dados.prof.nome}`,"","",dados.totalHoras+"h"]);
    totalGeral += dados.totalHoras;
  });
  montarTabelaRelatorio(ctx.area, "Horas Trabalhadas (Individual e Consolidado)", ctx.dataInicio, ctx.dataFim,
    ["Data / Profissional","Escala","Código","Horas"], linhas, ["TOTAL CONSOLIDADO","","",totalGeral+"h"]);
}

// ---- 11) Plantões (lista simples) ----
async function relPlantoes(ctx) { return relEscalas(ctx); }

// ---- 12) Plantões (Previsto x Realizados) ----
async function relPlantoesPrevistoRealizado(ctx) {
  const snap = await db.collection("historicoEscala").get();
  let linhas = snap.docs.map(d=>d.data())
    .filter(h => ctx.setorIds.includes(h.setorId))
    .filter(h => { const dt = new Date(h.ano, h.mes-1, h.dia); return dt >= new Date(ctx.dataInicio) && dt <= new Date(ctx.dataFim); })
    .filter(h => !ctx.profFiltroId || h.profissionalPrevistoId===ctx.profFiltroId || h.profissionalRealizadoId===ctx.profFiltroId)
    .sort((a,b)=> (a.ano-b.ano)||(a.mes-b.mes)||(a.dia-b.dia));
  montarTabelaRelatorio(ctx.area, "Plantões (Previsto x Realizados)", ctx.dataInicio, ctx.dataFim,
    ["Data","Escala","Código","Previsto (original)","Realizado (após troca)"],
    linhas.map(h=>[fmtData2(h.dia)+"/"+fmtData2(h.mes)+"/"+h.ano, ctx.nomeSetorFn(h.setorId), h.codigo, h.profissionalPrevistoNome, h.profissionalRealizadoNome]));
}

// ---- 13) Plantões Confirmados (trocas aprovadas no período) ----
async function relPlantoesConfirmados(ctx) {
  const snap = await db.collection("trocas").where("status","==","aprovada").limit(300).get();
  let linhas = snap.docs.map(d=>d.data())
    .sort((a,b)=>(b.decididoEm||0)-(a.decididoEm||0))
    .filter(t => ctx.setorIds.includes(t.setorId))
    .filter(t => { const dt = new Date(t.ano, t.mes-1, t.dia); return dt >= new Date(ctx.dataInicio) && dt <= new Date(ctx.dataFim); })
    .filter(t => !ctx.profFiltroId || t.profissionalDestinoId===ctx.profFiltroId);
  montarTabelaRelatorio(ctx.area, "Plantões Confirmados (via troca)", ctx.dataInicio, ctx.dataFim,
    ["Data","Escala","Código","Responsável atual","Autorizado por","Autorizado em"],
    linhas.map(t=>[fmtData2(t.dia)+"/"+fmtData2(t.mes)+"/"+t.ano, t.setorNome, t.codigo, t.profissionalDestinoNome, t.decididoPor||"-", t.decididoEm?new Date(t.decididoEm).toLocaleString("pt-BR"):"-"]));
}

// ---- 14) Profissionais (cadastro completo) ----
async function relProfissionaisRel(ctx) {
  let lista = ctx.profissionais.filter(p => !ctx.profFiltroId || p.id===ctx.profFiltroId);
  const colunas = ["Nome","Profissão","Entidade","CRM/COREN","Telefone","E-mail","Status"];
  if (ctx.incluirBancarios) colunas.push("CPF","PIX");
  montarTabelaRelatorio(ctx.area, "Profissionais", null, null, colunas, lista.map(p=>{
    const base = [p.nome, p.categoria||"Médico", nomeEntidade(p.entidadeId), (p.crm||"-")+(p.ufCrm?"/"+p.ufCrm:""), p.telefone1||"-", p.email||"-", p.ativo!==false?"Ativo":"Inativo"];
    if (ctx.incluirBancarios) base.push(p.cpf||"-", p.pix||"-");
    return base;
  }));
}

// ---- 15) Quantidade de Plantões (contagem simples) ----
async function relQtdPlantoes(ctx) {
  const plantoes = await buscarPlantoesPeriodo(ctx.setorIds, ctx.dataInicio, ctx.dataFim);
  const porProf = {};
  plantoes.forEach(p => { (porProf[p.profissionalId] ||= 0); porProf[p.profissionalId]++; });
  let linhas = Object.entries(porProf).filter(([id])=>!ctx.profFiltroId || id===ctx.profFiltroId)
    .map(([id,qtd]) => [ctx.profissionais.find(p=>p.id===id)?.nome||"?", qtd]);
  const total = linhas.reduce((s,l)=>s+l[1],0);
  montarTabelaRelatorio(ctx.area, "Quantidade de Plantões", ctx.dataInicio, ctx.dataFim,
    ["Profissional","Quantidade de Plantões"], linhas, ["TOTAL", total]);
}

// ---- 16) Quantidade de Plantões por Hora (contagem por código/duração — igual à planilha original) ----
async function relQtdPlantoesPorHora(ctx) {
  const plantoes = await buscarPlantoesPeriodo(ctx.setorIds, ctx.dataInicio, ctx.dataFim);
  const codigosUnicos = [...new Set(plantoes.map(p=>p.codigo))].sort();
  const porProf = {};
  plantoes.forEach(p => { (porProf[p.profissionalId] ||= {}); porProf[p.profissionalId][p.codigo] = (porProf[p.profissionalId][p.codigo]||0)+1; });
  let entradas = Object.entries(porProf).filter(([id])=>!ctx.profFiltroId || id===ctx.profFiltroId);
  const linhas = entradas.map(([id,contagem]) => {
    const nome = ctx.profissionais.find(p=>p.id===id)?.nome||"?";
    const total = Object.values(contagem).reduce((a,b)=>a+b,0);
    return [nome, ...codigosUnicos.map(c=>contagem[c]||0), total];
  });
  montarTabelaRelatorio(ctx.area, "Quantidade de Plantões por Hora (por código)", ctx.dataInicio, ctx.dataFim,
    ["Profissional", ...codigosUnicos, "Total"], linhas);
}

// ---- 17) Troca e Passagens entre Profissionais ----
async function relTrocasPassagens(ctx) {
  const snap = await db.collection("trocas").orderBy("solicitadoEm","desc").limit(300).get();
  let linhas = snap.docs.map(d=>d.data())
    .filter(t => ctx.setorIds.includes(t.setorId))
    .filter(t => { const dt = new Date(t.ano, t.mes-1, t.dia); return dt >= new Date(ctx.dataInicio) && dt <= new Date(ctx.dataFim); })
    .filter(t => !ctx.profFiltroId || t.profissionalOrigemId===ctx.profFiltroId || t.profissionalDestinoId===ctx.profFiltroId);
  montarTabelaRelatorio(ctx.area, "Troca e Passagens entre Profissionais", ctx.dataInicio, ctx.dataFim,
    ["Data do plantão","Escala","De","Para","Motivo","Status"],
    linhas.map(t=>[fmtData2(t.dia)+"/"+fmtData2(t.mes)+"/"+t.ano, t.setorNome, t.profissionalOrigemNome, t.profissionalDestinoNome, t.motivo||"-", t.status]));
}

// -------------------------------------------------------------------------
// 11. FECHAMENTO (completo, por tipo de escala, por profissional) + exportação
// -------------------------------------------------------------------------
async function renderFechamento() {
  const vp = document.getElementById("viewport");
  const hoje = new Date();
  const mes = ESTADO.escalaAtual.mes || hoje.getMonth()+1;
  const ano = ESTADO.escalaAtual.ano || hoje.getFullYear();
  const anosOpcoes = []; for (let a = hoje.getFullYear()-1; a <= hoje.getFullYear()+1; a++) anosOpcoes.push(a);
  const profissionais = await carregarProfissionais();

  vp.innerHTML = `
    <div class="cabecalho-pagina"><div><h2>Fechamento</h2><div class="desc">Fechamento mensal para pagamento (por mês/ano), com cálculo automático de valores. Escolha o tipo, o período, e exporte em PDF, Excel ou CSV.</div></div></div>
    <div class="barra-ferramentas">
      <select id="rTipo">
        <option value="completo">Completo (todos os tipos de escala)</option>
        <option value="setor">Por tipo de escala</option>
        <option value="profissional">Por profissional</option>
      </select>
      <select id="rSetor" style="display:none">${ESTADO.cacheTiposEscala.map(t=>`<option value="${t.id}">${escapeHtml(t.nome)}</option>`).join("")}</select>
      <select id="rProfissional" style="display:none">${profissionais.map(p=>`<option value="${p.id}">${escapeHtml(p.nome)}</option>`).join("")}</select>
      <select id="rMes">${MESES.map((m,i)=>`<option value="${i+1}" ${i+1===mes?"selected":""}>${m}</option>`).join("")}</select>
      <select id="rAno">${anosOpcoes.map(a=>`<option value="${a}" ${a===ano?"selected":""}>${a}</option>`).join("")}</select>
      <button class="btn btn-secundario" id="btnGerar">Gerar relatório</button>
    </div>
    <div class="barra-ferramentas">
      <button class="btn btn-primario" id="btnImprimirRel">🖨️ Imprimir / PDF</button>
      <button class="btn btn-sucesso" id="btnExcel">📊 Exportar Excel (.xlsx)</button>
      <button class="btn btn-secundario" id="btnCsv">📄 Exportar CSV</button>
    </div>
    <div id="areaRelatorio" class="cartao">Selecione o tipo de relatório e o período, depois clique em "Gerar relatório".</div>`;

  const rTipo = document.getElementById("rTipo");
  rTipo.addEventListener("change", () => {
    document.getElementById("rSetor").style.display = rTipo.value === "setor" ? "" : "none";
    document.getElementById("rProfissional").style.display = rTipo.value === "profissional" ? "" : "none";
  });

  document.getElementById("btnImprimirRel").addEventListener("click", () => window.print());
  document.getElementById("btnExcel").addEventListener("click", exportarExcel);
  document.getElementById("btnCsv").addEventListener("click", exportarCsv);
  document.getElementById("btnGerar").addEventListener("click", gerarFechamentoSelecionado);
  gerarFechamentoSelecionado();
}

async function gerarFechamentoSelecionado() {
  const tipo = document.getElementById("rTipo").value;
  const mes = +document.getElementById("rMes").value;
  const ano = +document.getElementById("rAno").value;
  ESTADO.escalaAtual.mes = mes; ESTADO.escalaAtual.ano = ano;
  if (tipo === "completo") return gerarRelatorioCompleto(mes, ano);
  if (tipo === "setor") return gerarRelatorioPorSetor(document.getElementById("rSetor").value, mes, ano);
  if (tipo === "profissional") return gerarRelatorioPorProfissional(document.getElementById("rProfissional").value, mes, ano);
}

function cabecalhoRelatorioHtml(titulo, mes, ano) {
  return `<div style="text-align:center;margin-bottom:14px">
    <h3 style="margin:0">SECRETARIA MUNICIPAL DE SAÚDE DE JABORANDI</h3>
    <div>${titulo} — ${MESES[mes-1]} de ${ano}</div>
  </div>`;
}

async function buscarDiasEscala(setorId, ano, mes) {
  const snap = await db.collection("escalas").where("setor","==",setorId).where("ano","==",ano).where("mes","==",mes).get();
  const porProf = {}; snap.docs.forEach(d => porProf[d.data().profissionalId] = d.data().dias || {});
  return porProf;
}

async function gerarRelatorioCompleto(mes, ano) {
  const area = document.getElementById("areaRelatorio");
  area.innerHTML = "Calculando...";
  const profissionais = await carregarProfissionais();
  const tipos = ESTADO.cacheTiposEscala;
  const dadosPorSetor = {};
  for (const t of tipos) dadosPorSetor[t.id] = await buscarDiasEscala(t.id, ano, mes);

  const linhas = profissionais.map(p => {
    let totalHoras = 0, totalValor = 0;
    const colunas = tipos.map(t => {
      const mapaCodigos = {}; (t.codigos||[]).forEach(c=>mapaCodigos[c.codigo]=c);
      const horas = calcularHorasProfissional(dadosPorSetor[t.id][p.id]||{}, mapaCodigos);
      const valorHora = buscarValorHora(t.id, p.categoria||"Médico");
      totalHoras += horas; totalValor += horas*valorHora;
      return horas;
    });
    return { p, colunas, totalHoras, totalValor };
  }).filter(l => l.totalHoras > 0);

  const totalGeral = linhas.reduce((s,l)=>s+l.totalValor,0);
  const colunasHtml = tipos.map(t=>`<th>${escapeHtml(t.nome)} (h)</th>`).join("");

  area.innerHTML = cabecalhoRelatorioHtml("Fechamento Completo", mes, ano) + `
    <table class="tabela">
      <thead><tr><th>Profissional</th><th>Categoria</th>${colunasHtml}<th>Total Horas</th><th>Total a Pagar</th></tr></thead>
      <tbody>
        ${linhas.map(l => `<tr>
          <td>${escapeHtml(l.p.nome)}</td><td>${escapeHtml(l.p.categoria||"Médico")}</td>
          ${l.colunas.map(h=>`<td>${h}h</td>`).join("")}
          <td>${l.totalHoras}h</td><td>${fmtMoeda(l.totalValor)}</td>
        </tr>`).join("")}
      </tbody>
      <tfoot><tr><td colspan="${2+tipos.length+1}" style="text-align:right;font-weight:700">TOTAL GERAL</td><td style="font-weight:700">${fmtMoeda(totalGeral)}</td></tr></tfoot>
    </table>`;

  ESTADO.ultimoRelatorio = {
    titulo: `Fechamento_Completo_${MESES[mes-1]}_${ano}`,
    colunas: ["Profissional","Categoria", ...tipos.map(t=>t.nome+" (h)"), "Total Horas", "Total a Pagar (R$)"],
    linhas: linhas.map(l => [l.p.nome, l.p.categoria||"Médico", ...l.colunas, l.totalHoras, l.totalValor.toFixed(2)]),
  };
}

async function gerarRelatorioPorSetor(setorId, mes, ano) {
  const area = document.getElementById("areaRelatorio");
  if (!setorId) { area.innerHTML = "Selecione um tipo de escala."; return; }
  area.innerHTML = "Calculando...";
  const tipo = ESTADO.cacheTiposEscala.find(t=>t.id===setorId);
  const mapaCodigos = {}; (tipo.codigos||[]).forEach(c=>mapaCodigos[c.codigo]=c);
  const profissionais = await carregarProfissionais();
  const dias = await buscarDiasEscala(setorId, ano, mes);

  const linhas = profissionais.map(p => {
    const horas = calcularHorasProfissional(dias[p.id]||{}, mapaCodigos);
    const valorHora = buscarValorHora(setorId, p.categoria||"Médico");
    return { p, horas, valorHora, valor: horas*valorHora };
  }).filter(l => l.horas > 0);

  const totalGeral = linhas.reduce((s,l)=>s+l.valor,0);

  area.innerHTML = cabecalhoRelatorioHtml(`Relatório · ${tipo.nome}`, mes, ano) + `
    <table class="tabela">
      <thead><tr><th>Profissional</th><th>Categoria</th><th>Horas</th><th>Valor/Hora</th><th>Total a Pagar</th></tr></thead>
      <tbody>
        ${linhas.map(l => `<tr>
          <td>${escapeHtml(l.p.nome)}</td><td>${escapeHtml(l.p.categoria||"Médico")}</td>
          <td>${l.horas}h</td><td>${fmtMoeda(l.valorHora)}</td><td>${fmtMoeda(l.valor)}</td>
        </tr>`).join("")}
      </tbody>
      <tfoot><tr><td colspan="4" style="text-align:right;font-weight:700">TOTAL GERAL</td><td style="font-weight:700">${fmtMoeda(totalGeral)}</td></tr></tfoot>
    </table>`;

  ESTADO.ultimoRelatorio = {
    titulo: `Relatorio_${tipo.nome.replace(/\s+/g,"_")}_${MESES[mes-1]}_${ano}`,
    colunas: ["Profissional","Categoria","Horas","Valor/Hora (R$)","Total a Pagar (R$)"],
    linhas: linhas.map(l => [l.p.nome, l.p.categoria||"Médico", l.horas, l.valorHora.toFixed(2), l.valor.toFixed(2)]),
  };
}

async function gerarRelatorioPorProfissional(profId, mes, ano) {
  const area = document.getElementById("areaRelatorio");
  if (!profId) { area.innerHTML = "Selecione um profissional."; return; }
  area.innerHTML = "Calculando...";
  const profissionais = await carregarProfissionais();
  const p = profissionais.find(x=>x.id===profId);
  const tipos = ESTADO.cacheTiposEscala;
  const totalDias = diasNoMes(ano, mes);

  const linhasDetalhe = [];
  let totalHorasGeral = 0, totalValorGeral = 0;
  for (const t of tipos) {
    const mapaCodigos = {}; (t.codigos||[]).forEach(c=>mapaCodigos[c.codigo]=c);
    const dias = (await buscarDiasEscala(t.id, ano, mes))[profId] || {};
    const valorHora = buscarValorHora(t.id, p.categoria||"Médico");
    for (let d=1; d<=totalDias; d++) {
      const cod = dias[d]; if (!cod) continue;
      const horas = mapaCodigos[cod]?.horas || 0;
      const valor = horas*valorHora;
      totalHorasGeral += horas; totalValorGeral += valor;
      linhasDetalhe.push({ dia:d, setor:t.nome, codigo:cod, nomeCodigo:mapaCodigos[cod]?.nome||cod, horas, valorHora, valor });
    }
  }
  linhasDetalhe.sort((a,b)=>a.dia-b.dia);

  area.innerHTML = cabecalhoRelatorioHtml(`Relatório Individual · ${p.nome}`, mes, ano) + `
    <p><b>Categoria:</b> ${escapeHtml(p.categoria||"Médico")} &nbsp; <b>CRM/COREN:</b> ${escapeHtml(p.crm||"-")} &nbsp; <b>CPF:</b> ${escapeHtml(p.cpf||"-")}</p>
    <table class="tabela">
      <thead><tr><th>Dia</th><th>Escala</th><th>Código</th><th>Descrição</th><th>Horas</th><th>Valor/Hora</th><th>Valor</th></tr></thead>
      <tbody>
        ${linhasDetalhe.map(l => `<tr>
          <td>${l.dia}</td><td>${escapeHtml(l.setor)}</td><td>${l.codigo}</td><td>${escapeHtml(l.nomeCodigo)}</td>
          <td>${l.horas}h</td><td>${fmtMoeda(l.valorHora)}</td><td>${fmtMoeda(l.valor)}</td>
        </tr>`).join("") || `<tr><td colspan="7">Nenhum plantão registrado neste período.</td></tr>`}
      </tbody>
      <tfoot><tr><td colspan="4" style="text-align:right;font-weight:700">TOTAL</td><td style="font-weight:700">${totalHorasGeral}h</td><td></td><td style="font-weight:700">${fmtMoeda(totalValorGeral)}</td></tr></tfoot>
    </table>`;

  ESTADO.ultimoRelatorio = {
    titulo: `Relatorio_${p.nome.replace(/\s+/g,"_")}_${MESES[mes-1]}_${ano}`,
    colunas: ["Dia","Escala","Código","Descrição","Horas","Valor/Hora (R$)","Valor (R$)"],
    linhas: linhasDetalhe.map(l => [l.dia, l.setor, l.codigo, l.nomeCodigo, l.horas, l.valorHora.toFixed(2), l.valor.toFixed(2)]),
  };
}

// ---- Exportação Excel (.xlsx) e CSV, a partir do último relatório gerado ----
function exportarExcel() {
  if (!ESTADO.ultimoRelatorio) { alert("Gere um relatório primeiro."); return; }
  const { titulo, colunas, linhas } = ESTADO.ultimoRelatorio;
  const ws = XLSX.utils.aoa_to_sheet([colunas, ...linhas]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Relatorio");
  XLSX.writeFile(wb, `${titulo}.xlsx`);
}

function exportarCsv() {
  if (!ESTADO.ultimoRelatorio) { alert("Gere um relatório primeiro."); return; }
  const { titulo, colunas, linhas } = ESTADO.ultimoRelatorio;
  const linhasCsv = [colunas, ...linhas].map(l => l.map(v => `"${String(v ?? "").replace(/"/g,'""')}"`).join(";"));
  const blob = new Blob(["\uFEFF" + linhasCsv.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${titulo}.csv`;
  a.click();
}

// -------------------------------------------------------------------------
// 12. USUÁRIOS E PERFIS (perfis de acesso configuráveis + criação direta de usuários)
// -------------------------------------------------------------------------
async function renderUsuarios() {
  const vp = document.getElementById("viewport");
  vp.innerHTML = `<div class="cartao">Carregando...</div>`;
  await recarregarPerfis();
  await carregarProfissionais();
  await carregarEntidades();
  const snap = await db.collection("usuarios").get();
  const usuarios = snap.docs.map(d => ({ id:d.id, ...d.data() }));
  const podeEditar = podeEditarTela("usuarios");

  vp.innerHTML = `
    <div class="cabecalho-pagina"><div><h2>Usuários e Perfis de Acesso</h2><div class="desc">Crie perfis com as permissões que quiser e cadastre usuários direto pelo sistema.</div></div></div>

    <div class="cabecalho-pagina" style="margin-bottom:8px">
      <h3 style="margin:0">Perfis de Acesso</h3>
      ${podeEditar ? `<button class="btn btn-primario" id="btnNovoPerfil">🗂️ Novo Perfil</button>` : ""}
    </div>
    <div class="cartao" style="overflow:auto">
      <table class="tabela">
        <thead><tr><th></th><th>Perfil</th><th>Telas com acesso total</th><th>Telas em modo visualização</th>${podeEditar?"<th></th>":""}</tr></thead>
        <tbody>
          ${ESTADO.cachePerfis.map(p => {
            const editaveis = TELAS_PERMISSAO.filter(t => p.permissoes?.[t.id]==="editar").length;
            const veem = TELAS_PERMISSAO.filter(t => p.permissoes?.[t.id]==="ver").length;
            return `<tr>
              <td><span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:${p.cor||"#999"}"></span></td>
              <td>${escapeHtml(p.nome)} ${p.protegido?'<span class="badge badge-cinza">Fixo</span>':""}</td>
              <td>${editaveis} de ${TELAS_PERMISSAO.length}</td>
              <td>${veem} de ${TELAS_PERMISSAO.length}</td>
              ${podeEditar ? `<td>
                <button class="icone-acao" data-editarperfil="${p.id}" title="Editar permissões">✏️</button>
                ${p.protegido ? "" : `<button class="icone-acao" data-excluirperfil="${p.id}" title="Excluir">🗑️</button>`}
              </td>` : ""}
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>

    <div class="cabecalho-pagina" style="margin-top:22px;margin-bottom:8px">
      <h3 style="margin:0">Usuários</h3>
      ${podeEditar ? `<button class="btn btn-primario" id="btnNovoUsuario">+ Novo Usuário</button>` : ""}
    </div>
    <div class="cartao" style="overflow:auto">
      <table class="tabela">
        <thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Profissional vinculado</th><th>Entidade</th><th>Status</th>${podeEditar?"<th></th>":""}</tr></thead>
        <tbody>
          ${usuarios.map(u => `
            <tr data-uid="${u.id}">
              <td>${escapeHtml(u.nome)}</td>
              <td>${escapeHtml(u.email)}</td>
              <td>
                ${podeEditar ? `<select class="selPerfil">
                  ${ESTADO.cachePerfis.map(p=>`<option value="${p.id}" ${u.perfil===p.id?"selected":""}>${escapeHtml(p.nome)}</option>`).join("")}
                  ${u.perfil==="pendente" ? `<option value="pendente" selected>Aguardando aprovação</option>` : ""}
                </select>` : nomePerfil(u.perfil)}
              </td>
              <td>
                ${podeEditar ? `<select class="selProfissional">
                  <option value="">— Nenhum (não é profissional escalado) —</option>
                  ${ESTADO.cacheProfissionais.map(p=>`<option value="${p.id}" ${u.profissionalId===p.id?"selected":""}>${escapeHtml(p.nome)}</option>`).join("")}
                </select>` : (ESTADO.cacheProfissionais.find(p=>p.id===u.profissionalId)?.nome || "—")}
              </td>
              <td>
                ${podeEditar ? `<select class="selEntidadeUsuario">
                  <option value="">— Todas / não se aplica —</option>
                  ${ESTADO.cacheEntidades.map(e=>`<option value="${e.id}" ${u.entidadeId===e.id?"selected":""}>${escapeHtml(e.nomeFantasia||e.razaoSocial)}</option>`).join("")}
                </select>` : nomeEntidade(u.entidadeId)}
              </td>
              <td><span class="badge ${u.ativo?"badge-verde":"badge-vermelho"}">${u.ativo?"Ativo":"Pendente/Bloqueado"}</span></td>
              ${podeEditar ? `<td>
                <button class="btn btn-sucesso salvarUsuario" style="padding:6px 10px">Salvar</button>
                <button class="btn btn-secundario resetarSenha" style="padding:6px 10px">🔑 Redefinir senha</button>
                ${u.ativo ? `<button class="btn btn-perigo bloquearUsuario" style="padding:6px 10px">Bloquear</button>` : ""}
              </td>` : ""}
            </tr>`).join("")}
        </tbody>
      </table>
    </div>
    <p style="font-size:.8rem;color:#6b7280">Novos usuários também podem se cadastrar sozinhos pela tela de login ("Criar acesso") — nesse caso eles ficam "Pendentes" até você definir um perfil aqui.
    Vincular a pessoa a um <b>Profissional</b> permite que ela solicite/receba trocas de plantão dos próprios turnos. Vincular a uma <b>Entidade</b> faz o Administrador/Diretor Clínico receber notificações apenas dos plantões daquele local (deixe em "Todas" se a pessoa responde por todos os locais).</p>`;

  if (!podeEditar) return;

  document.getElementById("btnNovoPerfil").addEventListener("click", () => modalPerfil());
  vp.querySelectorAll("[data-editarperfil]").forEach(b => b.addEventListener("click", () => modalPerfil(ESTADO.cachePerfis.find(p=>p.id===b.dataset.editarperfil))));
  vp.querySelectorAll("[data-excluirperfil]").forEach(b => b.addEventListener("click", async () => {
    if (!confirm("Excluir este perfil? Usuários que estiverem com ele ficarão sem acesso até você trocar o perfil deles.")) return;
    await db.collection("perfis").doc(b.dataset.excluirperfil).delete();
    renderUsuarios();
  }));

  document.getElementById("btnNovoUsuario").addEventListener("click", () => modalNovoUsuario());

  vp.querySelectorAll("tr[data-uid]").forEach(tr => {
    tr.querySelector(".salvarUsuario").addEventListener("click", async () => {
      const perfil = tr.querySelector(".selPerfil").value;
      const profissionalId = tr.querySelector(".selProfissional").value;
      const entidadeId = tr.querySelector(".selEntidadeUsuario").value;
      await db.collection("usuarios").doc(tr.dataset.uid).update({ perfil, ativo:true, profissionalId, entidadeId });
      renderUsuarios();
    });
    tr.querySelector(".bloquearUsuario")?.addEventListener("click", async () => {
      if (!confirm("Bloquear o acesso desta pessoa?")) return;
      await db.collection("usuarios").doc(tr.dataset.uid).update({ ativo:false });
      renderUsuarios();
    });
    tr.querySelector(".resetarSenha").addEventListener("click", async () => {
      const email = tr.children[1].textContent;
      try { await auth.sendPasswordResetEmail(email); alert(`E-mail de redefinição de senha enviado para ${email}.`); }
      catch (err) { alert("Não foi possível enviar: " + err.message); }
    });
  });
}

// ---- Perfis de Acesso: criar/editar com matriz de permissões por tela ----
function modalPerfil(perfil) {
  const editando = !!perfil;
  const p = perfil || { nome:"", cor: PALETA_CORES[ESTADO.cachePerfis.length % PALETA_CORES.length], permissoes:{} };
  const bloqueado = editando && p.protegido;
  const div = document.createElement("div");
  div.className = "modal-fundo";
  div.innerHTML = `
    <div class="modal" style="max-width:620px">
      <h3>${editando ? "Editar" : "Novo"} perfil de acesso</h3>
      ${bloqueado ? `<p style="font-size:.82rem;color:#6b7280">O perfil "Administrador" é fixo: sempre tem acesso total a todas as telas, para evitar que o sistema fique sem administrador.</p>` : ""}
      <div class="campos-2">
        <div class="campo"><label>Nome do perfil</label><input id="pNome" value="${escapeHtml(p.nome)}" ${bloqueado?"disabled":""}></div>
        <div class="campo"><label>Cor de identificação</label><input type="color" id="pCor" value="${p.cor||"#0b5394"}" style="width:60px;height:38px;padding:2px" ${bloqueado?"disabled":""}></div>
      </div>
      <label style="font-size:.78rem;font-weight:700;color:var(--azul-esc);text-transform:uppercase">Permissões por tela</label>
      <div style="margin-top:8px;display:flex;flex-direction:column;gap:6px;max-height:340px;overflow:auto">
        ${TELAS_PERMISSAO.map(t => `
          <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:6px 4px;border-bottom:1px solid #f0f2f5">
            <span>${t.label}</span>
            <select class="selPermissao" data-tela="${t.id}" ${bloqueado?"disabled":""} style="min-width:150px">
              ${Object.entries(NIVEIS_PERMISSAO).map(([val,label])=>`<option value="${val}" ${(p.permissoes?.[t.id]||"nenhum")===val?"selected":""}>${label}</option>`).join("")}
            </select>
          </div>`).join("")}
      </div>
      <div class="acoes">
        <button class="btn btn-secundario" id="mCancelar">Cancelar</button>
        ${bloqueado ? "" : `<button class="btn btn-primario" id="mSalvar">Salvar</button>`}
      </div>
    </div>`;
  document.body.appendChild(div);
  div.querySelector("#mCancelar").addEventListener("click", () => div.remove());
  div.querySelector("#mSalvar")?.addEventListener("click", async () => {
    const nome = div.querySelector("#pNome").value.trim();
    if (!nome) { alert("Informe o nome do perfil."); return; }
    const cor = div.querySelector("#pCor").value;
    const permissoes = {};
    div.querySelectorAll(".selPermissao").forEach(s => permissoes[s.dataset.tela] = s.value);
    if (editando) await db.collection("perfis").doc(p.id).update({ nome, cor, permissoes });
    else await db.collection("perfis").doc().set({ nome, cor, permissoes, protegido:false });
    div.remove();
    await recarregarPerfis();
    renderUsuarios();
  });
}

// ---- Novo Usuário: criado direto pelo painel, sem precisar de auto-cadastro ----
// Usamos uma segunda instância do Firebase só para criar a conta, assim a sessão do
// administrador que está logado não é substituída pela do usuário novo.
function modalNovoUsuario() {
  const div = document.createElement("div");
  div.className = "modal-fundo";
  div.innerHTML = `
    <div class="modal">
      <h3>Novo usuário</h3>
      <div id="areaMsgNovoUsuario"></div>
      <div class="campo"><label>Nome completo</label><input id="nuNome"></div>
      <div class="campo"><label>E-mail</label><input type="email" id="nuEmail"></div>
      <div class="campo"><label>Senha provisória (mín. 6 caracteres)</label><input type="text" id="nuSenha" minlength="6"></div>
      <div class="campo"><label>Perfil</label>
        <select id="nuPerfil">${ESTADO.cachePerfis.map(p=>`<option value="${p.id}">${escapeHtml(p.nome)}</option>`).join("")}</select>
      </div>
      <div class="campo"><label>Profissional vinculado (opcional)</label>
        <select id="nuProfissional">
          <option value="">— Nenhum —</option>
          ${ESTADO.cacheProfissionais.map(p=>`<option value="${p.id}">${escapeHtml(p.nome)}</option>`).join("")}
        </select>
      </div>
      <div class="campo"><label>Entidade responsável (opcional, para Administrador/Diretor Clínico)</label>
        <select id="nuEntidade">
          <option value="">— Todas —</option>
          ${ESTADO.cacheEntidades.map(e=>`<option value="${e.id}">${escapeHtml(e.nomeFantasia||e.razaoSocial)}</option>`).join("")}
        </select>
      </div>
      <p style="font-size:.78rem;color:#6b7280">Combine a senha provisória com a pessoa, ou use o botão "🔑 Redefinir senha" depois para que ela mesma escolha uma nova pelo e-mail.</p>
      <div class="acoes">
        <button class="btn btn-secundario" id="mCancelar">Cancelar</button>
        <button class="btn btn-primario" id="mSalvar">Criar usuário</button>
      </div>
    </div>`;
  document.body.appendChild(div);
  div.querySelector("#mCancelar").addEventListener("click", () => div.remove());
  div.querySelector("#mSalvar").addEventListener("click", async () => {
    const nome = div.querySelector("#nuNome").value.trim();
    const email = div.querySelector("#nuEmail").value.trim();
    const senha = div.querySelector("#nuSenha").value;
    const perfil = div.querySelector("#nuPerfil").value;
    const profissionalId = div.querySelector("#nuProfissional").value;
    const entidadeId = div.querySelector("#nuEntidade").value;
    if (!nome || !email || senha.length < 6) { alert("Preencha nome, e-mail e uma senha com pelo menos 6 caracteres."); return; }
    const btn = div.querySelector("#mSalvar"); btn.disabled = true; btn.textContent = "Criando...";
    try {
      const appSecundario = firebase.apps.find(a => a.name === "secundario") || firebase.initializeApp(firebaseConfig, "secundario");
      const authSecundario = appSecundario.auth();
      const cred = await authSecundario.createUserWithEmailAndPassword(email, senha);
      await db.collection("usuarios").doc(cred.user.uid).set({ nome, email, perfil, profissionalId, entidadeId, ativo:true, criadoEm: Date.now(), criadoPor: ESTADO.usuarioDoc.nome });
      await authSecundario.signOut();
      div.remove();
      renderUsuarios();
    } catch (err) {
      const area = div.querySelector("#areaMsgNovoUsuario");
      const mapa = { "auth/email-already-in-use":"Este e-mail já está cadastrado.", "auth/invalid-email":"E-mail inválido.", "auth/weak-password":"Senha muito curta." };
      area.innerHTML = `<div class="msg-erro">${mapa[err.code] || err.message}</div>`;
      btn.disabled = false; btn.textContent = "Criar usuário";
    }
  });
}
