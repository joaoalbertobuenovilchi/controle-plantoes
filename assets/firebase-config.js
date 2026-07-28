// ==========================================================================
// CONFIGURAÇÃO DO FIREBASE (o "banco de dados online" do sistema)
// ==========================================================================
// 1. Crie um projeto GRATUITO em https://console.firebase.google.com
// 2. Ative: Authentication > Sign-in method > E-mail/senha
// 3. Ative: Firestore Database > Criar banco de dados (modo produção)
// 4. Em "Configurações do projeto" > "Seus apps" > Web (</>), copie o
//    objeto firebaseConfig gerado e cole ele AQUI embaixo, substituindo
//    os valores de exemplo.
// 5. Suba as regras de segurança do arquivo firestore.rules (veja o README).
// ==========================================================================

const firebaseConfig = {
  apiKey: "AIzaSyACLLO3S7ua-CBt5mJJQ8fBBMbBDDwJkio",
  authDomain: "plantoes-jaborandi.firebaseapp.com",
  projectId: "plantoes-jaborandi",
  storageBucket: "plantoes-jaborandi.firebasestorage.app",
  messagingSenderId: "1023384993309",
  appId: "1:1023384993309:web:7b5969cb8c506d0e8d50f4"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
