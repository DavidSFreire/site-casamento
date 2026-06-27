// --- CONFIGURAÇÃO DO FIREBASE ---
// Cole aqui as SUAS credenciais obtidas no Passo 2
const firebaseConfig = {

    apiKey: "AIzaSyAaoaMx4ZAyrLcYaN7O2Oe03rlm6L9HAEY",

    authDomain: "casamento-isa-david.firebaseapp.com",

    databaseURL: "https://casamento-isa-david-default-rtdb.firebaseio.com",

    projectId: "casamento-isa-david",

    storageBucket: "casamento-isa-david.firebasestorage.app",

    messagingSenderId: "988788635273",

    appId: "1:988788635273:web:e28b00d92198cc741f7858"

  };


// Importando os módulos necessários do Firebase via CDN (Sem precisar instalar nada)
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

let presenteAtualId = null;
let maxDisponivel = 0;
let valoresArrecadadosGlobais = {}; // Armazenará os dados em tempo real vindos do Firebase

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

// --- SINCRONIZAÇÃO EM TEMPO REAL COM O FIREBASE ---
// Sempre que alguém abrir a página ou um valor mudar no banco, o Firebase avisa o site e atualiza as barras na hora!
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
        
        // Em vez de ler do HTML ou localStorage, lê o que está guardado no Firebase globalmente
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

// --- FUNÇÕES DO MODAL ---
// --- FUNÇÕES DO MODAL (EXPOSTAS GLOBALMENTE) ---
window.openCotaModal = function(nomePresente, idPresente) {
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
        
        // Pega o valor atualizado do Firebase para calcular o limite restante correto
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

window.closePixModal = function() {
    modal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

window.copyPixKey = function() {
    const pixKeyInput = document.getElementById("pixKey");
    pixKeyInput.select();
    pixKeyInput.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(pixKeyInput.value).then(() => {
        pixSuccessMsg.style.display = "block";
        setTimeout(() => { pixSuccessMsg.style.display = "none"; }, 3000);
    });
}

// --- SALVAR A CONTRIBUIÇÃO NO BANCO DE DADOS ---
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

    if (presenteAtualId !== 'livre') {
        // Usa uma transação para evitar que duas pessoas enviando ao mesmo tempo quebrem a soma
        const presenteEspecificoRef = ref(db, `presentes/${presenteAtualId}`);
        runTransaction(presenteEspecificoRef, (valorAtual) => {
            // Se o valor não existir no banco ainda, ele começa como 0 e soma o digitado
            return (valorAtual || 0) + valorDigitado;
        }).then(() => {
            alert(`Muito obrigado! Seu presente de R$ ${valorDigitado.toFixed(2).replace('.',',')} foi registrado e atualizado para todos.`);
            closePixModal();
        }).catch((error) => {
            console.error("Erro ao salvar:", error);
            alert("Houve um erro ao registrar. Tente novamente.");
        });
    } else {
        // Se for o pix livre, apenas avisa o usuário (já que não há meta cadastrada para somar em barra)
        alert(`Muito obrigado! Seu presente em PIX Livre de R$ ${valorDigitado.toFixed(2).replace('.',',')} foi confirmado.`);
        closePixModal();
    }
}
