/**
 * todasongs.js
 * Gerencia a listagem, filtro e busca de ONGs
 */

// ==============================================================
// 1. CONFIGURAÇÃO (CRÍTICO - NÃO APAGUE)
// ==============================================================

// Define a URL base vinda do config.js
const URL_BASE = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://localhost:1880';
// Headers para o Ngrok não travar (Obrigatório)
const headersNgrok = {
    headers: new Headers({ "ngrok-skip-browser-warning": "true" })
};

let categoriaAtual = 'TODAS'; 

console.log("Carregando todasongs.js com servidor:", URL_BASE);

// ==============================================================
// 2. RENDERIZAÇÃO (GRID DE CARDS)
// ==============================================================

function renderizarGridOngs(ongs) {
    const container = document.getElementById('grid-ongs');
    if (!container) return;
    
    container.innerHTML = '';

    if (!ongs || ongs.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; padding:50px; color:#777;">
                <i class="fa-solid fa-folder-open" style="font-size: 40px; margin-bottom:15px; opacity:0.5;"></i>
                <p>Nenhuma ONG encontrada com esses critérios.</p>
            </div>`;
        return;
    }

    // Cores sequenciais para os cards
    const coresCards = ['card-azul', 'card-vermelho', 'card-amarelo', 'card-verde'];

    ongs.forEach((ong, index) => {
        // Lógica de cor sequencial (0, 1, 2, 3, 0...)
        const corClass = coresCards[index % coresCards.length];
        
        const logoUrl = ong.logo_url || 'https://placehold.co/150?text=ONG';
        const local = ong.localizacao_curta || 'Brasil';
        
        const html = `
            <div class="card-ong ${corClass}" onclick="window.location.href='infoong.html?id=${ong.id}'">
                <div class="card-logo">
                    <img src="${logoUrl}" alt="${ong.nome}" onerror="this.src='https://placehold.co/150?text=Sem+Logo'">
                </div>
                <div class="card-info">
                    <div>
                        <h3>${ong.nome}</h3>
                        <p class="card-info-local"><i class="fa-solid fa-location-dot"></i> ${local}</p>
                    </div>
                    <div class="card-footer">
                        <span>Ver detalhes</span>
                        <div class="btn-card-arrow">
                            <i class="fa-solid fa-arrow-right"></i>
                        </div>
                    </div>
                </div>
            </div>`;
        container.insertAdjacentHTML('beforeend', html);
    });
}

// ==============================================================
// 3. BUSCA E FILTROS (CONECTA NO NODE-RED)
// ==============================================================

async function carregarEFiltrarOngs() {
    const input = document.getElementById('input-busca-ongs');
    const termo = input ? input.value.toLowerCase().trim() : "";

    try {
        // Chama o backend usando URL_BASE e headersNgrok
        const res = await fetch(`${URL_BASE}/ongs`, headersNgrok);
        const ongs = await res.json();

        let filtradas = ongs;

        // 1. Filtro por Categoria
        if (categoriaAtual !== 'TODAS') {
            filtradas = filtradas.filter(ong => ong.cor_tag === categoriaAtual);
        }

        // 2. Filtro por Texto
        if (termo.length > 0) {
            filtradas = filtradas.filter(ong => 
                ong.nome.toLowerCase().includes(termo) || 
                (ong.descricao && ong.descricao.toLowerCase().includes(termo))
            );
        }

        renderizarGridOngs(filtradas);

    } catch (err) {
        console.error("Erro ao carregar ONGs:", err);
        const container = document.getElementById('grid-ongs');
        if(container) container.innerHTML = '<p style="text-align:center; width:100%;">Erro de conexão com o servidor.</p>';
    }
}

// Inicializa Dropdown Categorias
async function inicializarCategorias() {
    const btnCategorias = document.querySelector('.categorias');
    const menuCategorias = document.getElementById('menu-categorias');
    
    if (!btnCategorias || !menuCategorias) return;

    const categoriaConfig = {
        'TODAS': { icone: 'fa-th', nome: 'Todas' },
        'SOCIAL': { icone: 'fa-hand-holding-heart', nome: 'Social' },
        'ANIMAL': { icone: 'fa-paw', nome: 'Animal' },
        'AMBIENTE': { icone: 'fa-leaf', nome: 'Ambiente' },
        'EDUCACAO': { icone: 'fa-graduation-cap', nome: 'Educação' },
        'SAUDE': { icone: 'fa-heartbeat', nome: 'Saúde' },
        'CULTURA': { icone: 'fa-palette', nome: 'Cultura' },
        'ESPORTE': { icone: 'fa-futbol', nome: 'Esporte' }
    };

    try {
        const res = await fetch(`${URL_BASE}/ongs`, headersNgrok);
        const ongs = await res.json();
        
        // Pega categorias únicas que existem no banco
        const catsDisponiveis = [...new Set(ongs.map(o => o.cor_tag))].filter(Boolean).sort();

        menuCategorias.innerHTML = '';
        
        // Função auxiliar
        const criarItem = (cat, label, icon) => {
            const div = document.createElement('div');
            div.className = `categoria-item`;
            div.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${label}</span>`;
            div.addEventListener('click', () => {
                categoriaAtual = cat;
                document.querySelectorAll('.categoria-item').forEach(i => i.classList.remove('ativa'));
                div.classList.add('ativa');
                
                menuCategorias.classList.remove('ativo');
                btnCategorias.innerHTML = `${label} <i class="fa-solid fa-angle-down"></i>`;
                
                carregarEFiltrarOngs();
            });
            return div;
        };

        // Adiciona "Todas"
        menuCategorias.appendChild(criarItem('TODAS', 'Todas', 'fa-th'));

        // Adiciona Categorias Dinâmicas
        catsDisponiveis.forEach(cat => {
            const config = categoriaConfig[cat] || { icone: 'fa-tag', nome: cat };
            menuCategorias.appendChild(criarItem(cat, config.nome, config.icone));
        });

        // Abrir/Fechar menu
        btnCategorias.addEventListener('click', (e) => {
            e.stopPropagation();
            menuCategorias.classList.toggle('ativo');
        });

        document.addEventListener('click', (e) => {
            if (!btnCategorias.contains(e.target) && !menuCategorias.contains(e.target)) {
                menuCategorias.classList.remove('ativo');
            }
        });

    } catch (e) { console.error("Erro categorias:", e); }
}

// ==============================================================
// 4. HEADER E SIDEBAR (Perfil do Usuário Logado)
// ==============================================================

async function carregarPerfil() {
    const cpf = localStorage.getItem('usuarioLogado');
    if (!cpf) return;
    
    try {
        const res = await fetch(`${URL_BASE}/perfil?t=${Date.now()}`, headersNgrok);
        const dados = await res.json();
        const perfil = Array.isArray(dados) ? dados.find(u => u.cpf === cpf) : dados;
        
        if (perfil) {
            const nome = perfil.nome.split(' ')[0];
            const foto = perfil.foto || 'imagens/usuario.png';
            
            // Header
            const elNomeHeader = document.getElementById('nome-usuario');
            const elFotoHeader = document.getElementById('foto-usuario');
            if(elNomeHeader) elNomeHeader.textContent = `Olá, ${nome}!`;
            if(elFotoHeader) elFotoHeader.src = foto;

            // Sidebar
            const elNomeSidebar = document.getElementById('sidebar-nome');
            const elFotoSidebar = document.getElementById('sidebar-foto');
            if(elNomeSidebar) elNomeSidebar.textContent = `Olá, ${nome}`;
            if(elFotoSidebar) elFotoSidebar.src = foto;
        }
    } catch(e) { console.error("Erro perfil:", e); }
}

function inicializarSidebar() {
    const btnUser = document.querySelector('.usuario'); // Botão no header
    const sidebar = document.getElementById('sidebar-perfil');
    const overlay = document.getElementById('sidebar-overlay');
    const btnClose = document.getElementById('btn-fechar-sidebar');
    const btnSair = document.querySelector('.sidebar-sair a');
    
    const toggle = (s) => { 
        if(sidebar) sidebar.classList.toggle('ativo', s); 
        if(overlay) overlay.classList.toggle('ativo', s);
    };
    
    if(btnUser) btnUser.addEventListener('click', (e) => { e.stopPropagation(); toggle(true); });
    if(btnClose) btnClose.addEventListener('click', () => toggle(false));
    if(overlay) overlay.addEventListener('click', () => toggle(false));
    if(btnSair) btnSair.addEventListener('click', () => localStorage.removeItem('usuarioLogado'));
}

// ==============================================================
// 5. ALTO CONTRASTE
// ==============================================================

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
// 6. INICIALIZAÇÃO GERAL
// ==============================================================

document.addEventListener('DOMContentLoaded', () => {
    carregarEFiltrarOngs();
    inicializarCategorias();
    carregarPerfil();
    inicializarSidebar();
    inicializarAltoContraste();

    // Configura a busca com delay
    let timeout;
    const inputBusca = document.getElementById('input-busca-ongs');
    if(inputBusca) {
        inputBusca.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(carregarEFiltrarOngs, 500);
        });
    }
});