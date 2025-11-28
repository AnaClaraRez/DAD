/**
 * historicodoacao.js
 * Gerencia a lista de doações passadas do usuário
 */

// ==============================================================
// 1. CONFIGURAÇÃO
// ==============================================================
const URL_BASE = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://localhost:1880';
// Headers para passar pelo Ngrok
const headersNgrok = {
    headers: new Headers({ "ngrok-skip-browser-warning": "true" })
};

let doacoesData = [];

// ==============================================================
// 2. CARREGAR DADOS
// ==============================================================
async function carregarPerfilUsuario() {
    try {
        // 1. Pega o CPF de quem fez login
        const cpfLogado = localStorage.getItem('usuarioLogado');
        
        if (!cpfLogado) {
            console.warn("Nenhum usuário logado.");
            // window.location.href = 'index.html'; 
            return; 
        }

        // Adiciona headersNgrok na requisição
        const response = await fetch(`${URL_BASE}/perfil?t=${Date.now()}`, headersNgrok);
        const dados = await response.json();
        
        let perfil = null;

        // 2. Procura o usuário específico pelo CPF
        if (Array.isArray(dados)) {
            perfil = dados.find(u => u.cpf === cpfLogado);
        } else {
            if (dados.cpf === cpfLogado) perfil = dados;
        }

        if (perfil) {
            atualizarInterfaceUsuario(perfil);

            // Carrega Histórico
            if (perfil.historico_doacoes && Array.isArray(perfil.historico_doacoes)) {
                doacoesData = perfil.historico_doacoes;
                // Inverte para mostrar as mais recentes primeiro por padrão
                // (Cria uma cópia para não alterar se for referência)
                doacoesData = [...doacoesData].reverse();
                renderizarTela();
            } else {
                mostrarEstadoVazio();
            }
        } else {
            console.error("Usuário não encontrado.");
        }

    } catch (err) {
        console.error('Erro ao carregar perfil:', err);
    }
}

function atualizarInterfaceUsuario(perfil) {
    const primeiroNome = perfil.nome ? perfil.nome.split(' ')[0] : 'Usuário';
    
    const elNomeHeader = document.getElementById('greeting-name');
    const elNomeSidebar = document.getElementById('sidebar-nome');
    const elFotoHeader = document.querySelector('.profile-pic');
    const elFotoSidebar = document.getElementById('sidebar-foto');

    if(elNomeHeader) elNomeHeader.textContent = `Olá, ${primeiroNome}!`;
    if(elNomeSidebar) elNomeSidebar.textContent = `Olá, ${primeiroNome}`;
    
    const fotoUrl = perfil.foto || 'imagens/usuario.png';
    if(elFotoHeader) elFotoHeader.src = fotoUrl;
    if(elFotoSidebar) elFotoSidebar.src = fotoUrl;
}

// ==============================================================
// 3. RENDERIZAÇÃO
// ==============================================================
function renderizarTela() {
    const historicoContainer = document.getElementById('historico-list');
    if (!historicoContainer) return;

    if (doacoesData.length === 0) {
        mostrarEstadoVazio();
        return;
    }

    // Cálculos
    const totalDoado = doacoesData.reduce((sum, d) => sum + Number(d.valor || 0), 0);
    const ongsUnicas = [...new Set(doacoesData.map(d => d.ong_nome))].length;
    const totalDoacoes = doacoesData.length;

    atualizarEstatisticas(totalDoado, ongsUnicas, totalDoacoes);
    
    // Limpa e renderiza
    historicoContainer.innerHTML = '';
    renderizarLista(doacoesData);
}

function mostrarEstadoVazio() {
    const container = document.getElementById('historico-list');
    if(container) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-hand-holding-heart"></i>
                <h3>Nenhuma doação encontrada</h3>
                <p>Suas doações aparecerão aqui.</p>
            </div>`;
    }
    atualizarEstatisticas(0, 0, 0);
}

function atualizarEstatisticas(total, ongs, qtd) {
    const elTotal = document.getElementById('total-doado');
    const elOngs = document.getElementById('ongs-apoiadas');
    const elQtd = document.getElementById('total-doacoes');

    if (elTotal) elTotal.textContent = formatarValor(total);
    if (elOngs) elOngs.textContent = ongs;
    if (elQtd) elQtd.textContent = qtd;
}

function formatarValor(valor) {
    const numero = Number(valor);
    if (isNaN(numero)) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numero);
}

function formatarData(dataString) {
    if (!dataString) return "--/--/----";
    // Se a data vier incompleta (ex: "2023-11-25"), adiciona hora para evitar confusão de fuso
    let dataParaFormatar = dataString;
    if(dataString.length <= 10) dataParaFormatar += "T12:00:00";
    
    try { return new Date(dataParaFormatar).toLocaleDateString('pt-BR'); } 
    catch (e) { return dataString; }
}

function renderizarLista(doacoes) {
    const container = document.getElementById('historico-list');
    if(!container) return;

    doacoes.forEach((doacao) => {
        const valorFormatado = formatarValor(doacao.valor);
        const dataFormatada = formatarData(doacao.data);
        const horaExibicao = doacao.hora ? ` às ${doacao.hora}` : ''; 
        
        const ongLogo = doacao.ong_logo || 'imagens/default-ong.png';
        const ongNome = doacao.ong_nome || 'ONG Parceira';
        const metodo = doacao.metodo || 'Doação';

        const html = `
            <div class="doacao-item">
                <div class="ong-details">
                    <div class="ong-icon">
                        <img src="${ongLogo}" alt="Logo" onerror="this.src='https://placehold.co/100'">
                    </div>
                    <div class="ong-info">
                        <span class="ong-name">${ongNome}</span>
                        <span class="doacao-metodo">
                            <i class="fa-solid fa-credit-card"></i> ${metodo}
                        </span>
                    </div>
                </div>
                <div class="doacao-right">
                    <span class="valor">${valorFormatado}</span>
                    <span class="data">
                        <i class="fa-regular fa-calendar"></i> ${dataFormatada}${horaExibicao}
                    </span>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    });
}

// ==============================================================
// 4. FILTROS E ORDENAÇÃO
// ==============================================================
function inicializarFiltros() {
    const btns = document.querySelectorAll('.filter-btn');
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            aplicarFiltro(btn.dataset.filter);
        });
    });
}

function aplicarFiltro(tipo) {
    // Cria uma cópia da lista original para não perder a ordem
    let filtradas = [...doacoesData];

    if (tipo === 'recentes') {
        // Ordena por Data (do mais novo para o mais antigo)
        filtradas.sort((a, b) => {
            // Converte strings de data para objetos Date
            const dataA = new Date(a.data);
            const dataB = new Date(b.data);
            return dataB - dataA;
        });
    } 
    else if (tipo === 'maiores') {
        // Ordena por Valor (do maior para o menor)
        filtradas.sort((a, b) => {
            const valorA = parseFloat(a.valor || 0);
            const valorB = parseFloat(b.valor || 0);
            return valorB - valorA;
        });
    }
    // Se for 'todas', usa a ordem padrão (que já definimos como reverso no carregamento)

    // Limpa e renderiza novamente
    const container = document.getElementById('historico-list');
    if(container) {
        container.innerHTML = '';
        renderizarLista(filtradas);
    }
}

// ==============================================================
// 5. SIDEBAR, LOGOUT E ALTO CONTRASTE
// ==============================================================
function inicializarSidebar() {
    const btnMenu = document.querySelector('.profile-info');
    const sidebar = document.getElementById('sidebar-perfil');
    const overlay = document.getElementById('sidebar-overlay');
    const btnFechar = document.getElementById('btn-fechar-sidebar');

    const toggle = (st) => {
        if(sidebar && overlay) {
            if(st) { sidebar.classList.add('ativo'); overlay.classList.add('ativo'); }
            else { sidebar.classList.remove('ativo'); overlay.classList.remove('ativo'); }
        }
    };

    if(btnMenu) btnMenu.addEventListener('click', (e) => { e.stopPropagation(); toggle(true); });
    if(btnFechar) btnFechar.addEventListener('click', () => toggle(false));
    if(overlay) overlay.addEventListener('click', () => toggle(false));
}

function inicializarLogout() {
    const btnSair = document.querySelector('.sidebar-sair a'); 
    if (btnSair) {
        btnSair.addEventListener('click', (e) => {
            localStorage.removeItem('usuarioLogado');
            // O href="index.html" já redireciona
        });
    }
}

function inicializarAltoContraste() {
    const btn = document.getElementById('toggle-alto-contraste');
    const body = document.body;
    
    if (localStorage.getItem('altoContraste') === 'ativado') {
        body.classList.add('daltonismo-mode');
    }

    if (btn) {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            body.classList.toggle('daltonismo-mode');
            if (body.classList.contains('daltonismo-mode')) {
                localStorage.setItem('altoContraste', 'ativado');
            } else {
                localStorage.removeItem('altoContraste');
            }
        });
    }
}

// ==============================================================
// INICIALIZAÇÃO
// ==============================================================
document.addEventListener('DOMContentLoaded', () => {
    carregarPerfilUsuario();
    inicializarFiltros();
    inicializarSidebar();
    inicializarLogout();
    inicializarAltoContraste();
});