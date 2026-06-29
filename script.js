// --- CONFIGURAÇÃO DO FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyAaoaMx4ZAyrLcYaN7O2Oe03rlm6L9HAEY",
    authDomain: "casamento-isa-david.firebaseapp.com",
    databaseURL: "https://casamento-isa-david-default-rtdb.firebaseio.com",
    projectId: "casamento-isa-david",
    storageBucket: "casamento-isa-david.firebasestorage.app",
    messagingSenderId: "988788635273",
    appId: "1:988788635273:web:e28b00d92198cc741f7858"
};

// Importando módulos necessários do Firebase (SDK v10+)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue, runTransaction } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- ELEMENTOS DO DOM ---
const modal = document.getElementById("pixModal");
const modalTitle = document.getElementById("modalTitle");
const pixSuccessMsg = document.getElementById("pixSuccessMsg");
const btnConfirmarPgto = document.getElementById("btnConfirmarPgto");
const contribValueInput = document.getElementById("contribValue");
const maxLimitNotice = document.getElementById("maxLimitNotice");
const cotaInputArea = document.getElementById("cotaInputArea");
const productLinkArea = document.getElementById("productLinkArea");
const productLink = document.getElementById("productLink");

// Elementos da Segunda Etapa do Modal
const modalStep1 = document.getElementById("modalStep1");
const modalStep2 = document.getElementById("modalStep2");
const btnVoltarStep1 = document.getElementById("btnVoltarStep1");
const btnConfirmarFinal = document.getElementById("btnConfirmarFinal");

let presenteAtualId = null;
let maxDisponivel = 0;
let valoresArrecadadosGlobais = {}; // Armazena dados vindos do Firebase

// --- ANIMAÇÃO DE ROLAGEM SUAVE ---
document.querySelectorAll('.js-scroll').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// --- ESCUTADOR DO FIREBASE (TEMPO REAL) ---
const presentesRef = ref(db, 'presentes');
onValue(presentesRef, (snapshot) => {
    valoresArrecadadosGlobais = snapshot.val() || {};
    atualizarTodosOsPresentes();
});

function atualizarTodosOsPresentes() {
    const cards = document.querySelectorAll('.gift-card');

    cards.forEach(card => {
        const id = card.id.replace('card-', '');
        if (id === 'livre') return;

        const total = parseFloat(card.getAttribute('data-total'));
        let arrecadadoTotal = valoresArrecadadosGlobais[id] ? parseFloat(valoresArrecadadosGlobais[id]) : 0;

        if (arrecadadoTotal > total) arrecadadoTotal = total;

        const restante = total - arrecadadoTotal;
        const porcentagem = (arrecadadoTotal / total) * 100;

        const barra = document.getElementById(`bar-${id}`);
        const statusText = document.getElementById(`status-${id}`);
        const btn = document.getElementById(`btn-${id}`);

        if (barra) barra.style.width = `${porcentagem}%`;
        
        if (statusText) {
            if (restante <= 0) {
                statusText.innerText = "Meta atingida! Obrigado! 🎉";
                card.classList.add('concluido');
                if (btn) {
                    btn.innerText = "Concluído";
                    btn.disabled = true;
                }
            } else {
                statusText.innerText = `Arrecadado: R$ ${arrecadadoTotal.toFixed(2).replace('.',',')} | Faltam: R$ ${restante.toFixed(2).replace('.',',')}`;
            }
        }
    });
}

// --- LOGICA E FUNÇÕES DO MODAL ---
function openCotaModal(nomePresente, idPresente) {
    // Força o modal a sempre abrir no Passo 1
    modalStep1.style.display = "block";
    modalStep2.style.display = "none";

    modalTitle.innerText = nomePresente;
    presenteAtualId = idPresente;
    pixSuccessMsg.style.display = "none";
    maxLimitNotice.style.display = "none";

    if (idPresente !== 'livre') {
        const card = document.getElementById(`card-${idPresente}`);
        const urlProduto = card.getAttribute('data-link');
        
        if (urlProduto && urlProduto.trim() !== "") {
            productLink.href = urlProduto;
            productLinkArea.style.display = "block";
        } else {
            productLinkArea.style.display = "none";
        }

        cotaInputArea.style.display = "block";
        const total = parseFloat(card.getAttribute('data-total'));
        const arrecadadoTotal = valoresArrecadadosGlobais[idPresente] ? parseFloat(valoresArrecadadosGlobais[idPresente]) : 0;
        
        maxDisponivel = total - arrecadadoTotal;
        contribValueInput.value = maxDisponivel;
        contribValueInput.max = maxDisponivel;
    } else {
        productLinkArea.style.display = "none";
        cotaInputArea.style.display = "block";
        contribValueInput.value = 50;
        maxDisponivel = 999999;
    }

    modal.style.display = "block";
}

function closePixModal() {
    modal.style.display = "none";
}

function copyPixKey() {
    const pixKeyInput = document.getElementById("pixKey");
    pixKeyInput.select();
    pixKeyInput.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(pixKeyInput.value).then(() => {
        pixSuccessMsg.style.display = "block";
        setTimeout(() => { pixSuccessMsg.style.display = "none"; }, 3000);
    });
}

// --- GERENCIADOR DE CLIQUES (EVENT LISTENERS NATIVOS) ---
document.addEventListener('click', function(e) {
    // Abrir o modal
    if (e.target && e.target.classList.contains('js-open-modal')) {
        const nome = e.target.getAttribute('data-nome');
        const id = e.target.getAttribute('data-id');
        openCotaModal(nome, id);
    }
    
    // Fechar o modal (botão X)
    if (e.target && e.target.classList.contains('close')) {
        closePixModal();
    }
    
    // Copiar chave PIX
    if (e.target && e.target.classList.contains('js-copy-pix')) {
        copyPixKey();
    }
});

// Fechar ao clicar fora do modal
window.onclick = function(event) {
    if (event.target == modal) {
        closePixModal();
    }
}

// --- FLUXO DE CONFIRMAÇÃO (DUAS ETAPAS) ---

// Etapa 1: Valida o valor e avança para a tela de confirmação
if(btnConfirmarPgto) {
    btnConfirmarPgto.onclick = function() {
        const valorDigitado = parseFloat(contribValueInput.value);

        if (isNaN(valorDigitado) || valorDigitado <= 0) {
            alert("Por favor, insira um valor válido para contribuir.");
            return;
        }

        if (valorDigitado > maxDisponivel && presenteAtualId !== 'livre') {
            maxLimitNotice.innerText = `O valor máximo restante para este item é R$ ${maxDisponivel.toFixed(2).replace('.',',')}`;
            maxLimitNotice.style.display = "block";
            return;
        }

        // Esconde o passo 1 e mostra a confirmação final
        modalStep1.style.display = "none";
        modalStep2.style.display = "block";
    }
}

// Voltar da Etapa 2 para a Etapa 1
if(btnVoltarStep1) {
    btnVoltarStep1.onclick = function() {
        modalStep2.style.display = "none";
        modalStep1.style.display = "block";
    }
}

// Etapa 2: Confirmação Final - Salvar no Firebase
if(btnConfirmarFinal) {
    btnConfirmarFinal.onclick = function() {
        const valorDigitado = parseFloat(contribValueInput.value);

        if (presenteAtualId !== 'livre') {
            const presenteEspecificoRef = ref(db, `presentes/${presenteAtualId}`);
            runTransaction(presenteEspecificoRef, (valorAtual) => {
                return (valorAtual || 0) + valorDigitado;
            }).then(() => {
                alert(`Muito obrigado! Seu presente de R$ ${valorDigitado.toFixed(2).replace('.',',')} foi registrado e atualizado para todos.`);
                closePixModal();
            }).catch((error) => {
                console.error("Erro ao salvar:", error);
                alert("Houve um erro ao registrar. Tente novamente.");
            });
        } else {
            alert(`Muito obrigado! Seu presente em PIX Livre de R$ ${valorDigitado.toFixed(2).replace('.',',')} foi confirmado.`);
            closePixModal();
        }
    }
}
