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

window.onload = function() {
    atualizarTodosOsPresentes();
    
    // Alerta informativo sobre a sincronização de dados globais
    console.warn("Nota de Hospedagem: Como o site está no GitHub Pages, os valores confirmados via botão salvam apenas localmente (localStorage). Para sincronização global em tempo real entre todos os convidados, é recomendada a integração com uma API gratuita como Firebase, Supabase, ou um script conectado ao Google Sheets.");
}

function atualizarTodosOsPresentes() {
    const cards = document.querySelectorAll('.gift-card');
    const locais = JSON.parse(localStorage.getItem('minhasContribuicoes')) || {};

    cards.forEach(card => {
        const id = card.id.replace('card-', '');
        if (id === 'livre') return;

        const total = parseFloat(card.getAttribute('data-total'));
        let arrecadadoBase = parseFloat(card.getAttribute('data-arrecadado'));
        
        let arrecadadoLocal = locais[id] ? locais[id] : 0;
        let arrecadadoTotal = arrecadadoBase + arrecadadoLocal;

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

function openCotaModal(nomePresente, idPresente) {
    modalTitle.innerText = nomePresente;
    presenteAtualId = idPresente;
    pixSuccessMsg.style.display = "none";
    maxLimitNotice.style.display = "none";

    // --- LOGICA DO LINK DO PRODUTO NO MODAL ---
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
        const arrecadadoBase = parseFloat(card.getAttribute('data-arrecadado'));
        
        const locais = JSON.parse(localStorage.getItem('minhasContribuicoes')) || {};
        const arrecadadoLocal = locais[idPresente] ? locais[idPresente] : 0;
        
        maxDisponivel = total - (arrecadadoBase + arrecadadoLocal);
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

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
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
        let locais = JSON.parse(localStorage.getItem('minhasContribuicoes')) || {};
        locais[presenteAtualId] = (locais[presenteAtualId] || 0) + valorDigitado;
        localStorage.setItem('minhasContribuicoes', JSON.stringify(locais));
    }

    alert(`Muito obrigado! Seu presente de R$ ${valorDigitado.toFixed(2).replace('.',',')} foi registrado.`);
    closePixModal();
    atualizarTodosOsPresentes();
}