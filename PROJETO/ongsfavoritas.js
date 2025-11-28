// ==============================================================
// 1. CONFIGURAÇÃO
// ==============================================================
const URL_BASE = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://localhost:1880';
const headersNgrok = {
    headers: new Headers({ "ngrok-skip-browser-warning": "true" })
};

// ==============================================================
// 2. CARREGAR DADOS
// ==============================================================
async function carregarOngsFavoritas() {
    const cpfLogado = localStorage.getItem('usuarioLogado');
    
    if (!cpfLogado) {
        alert("Faça login para ver seus favoritos.");
        window.location.href = "index.html";
        return;
    }

    try {
        // Busca Perfil e ONGs em paralelo
        const [perfilResponse, ongsResponse] = await Promise.all([
            fetch(`${URL_BASE}/perfil?t=${Date.now()}`, headersNgrok),
            fetch(`${URL_BASE}/ongs`, headersNgrok)
        ]);
        
        const dadosPerfil = await perfilResponse.json();
        const todasOngs = await ongsResponse.json();
        
        // Encontra usuário
        const perfil = Array.isArray(dadosPerfil) ? dadosPerfil.find(u => u.cpf === cpfLogado) : dadosPerfil;

        if (perfil) {
            atualizarInterfaceUsuario(perfil);
            
            // Filtra ONGs
            if (perfil.ongs_favoritas && perfil.ongs_favoritas.length > 0) {
                // Converte para string para comparar IDs com segurança
                const ongsFavoritas = todasOngs.filter(ong => 
                    perfil.ongs_favoritas.some(favId => String(favId) === String(ong.id))
                );
                
                if (ongsFavoritas.length > 0) {
                    renderizarOngs(ongsFavoritas);
                } else {
                    mostrarEstadoVazio();
                }
            } else {
                mostrarEstadoVazio();
            }
        }
    } catch (err) {
        console.error('Erro ao carregar favoritos:', err);
        mostrarEstadoVazio();
    }
}

// ==============================================================
// 3. RENDERIZAÇÃO
// ==============================================================
function renderizarOngs(ongs) {
    const grid = document.getElementById('ongs-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    ongs.forEach(ong => {
        const corClass = getCorClass(ong.cor_tag);
        const verificado = ong.verificado ? '<i class="fa-solid fa-circle-check verified-badge"></i>' : '';
        
        const html = `
            <div class="ong-card ${corClass}" onclick="window.location.href='infoong.html?id=${ong.id}'">
                <button class="btn-favorito" onclick="removerFavorito('${ong.id}', this, event)">
                    <i class="fa-solid fa-heart"></i>
                </button>
                
                <div class="ong-card-header">
                    <div class="ong-logo-container">
                        <img src="${ong.logo_url || 'https://placehold.co/150'}" alt="Logo">
                    </div>
                    <div class="ong-info">
                        <h3 class="ong-nome">${ong.nome} ${verificado}</h3>
                        <p class="ong-localizacao">
                            <i class="fa-solid fa-location-dot"></i>
                            ${ong.localizacao_curta || 'Brasil'}
                        </p>
                    </div>
                </div>
            </div>`;
        
        grid.insertAdjacentHTML('beforeend', html);
    });
}

function mostrarEstadoVazio() {
    const grid = document.getElementById('ongs-grid');
    if (!grid) return;
    
    grid.innerHTML = `
        <div class="empty-state">
            <i class="fa-solid fa-heart-crack"></i>
            <h3>Nenhuma ONG favoritada ainda</h3>
            <p>Explore e adicione ONGs aos seus favoritos!</p>
            <button class="btn-explorar" onclick="window.location.href='todasongs.html'">
                <i class="fa-solid fa-compass"></i> Explorar ONGs
            </button>
        </div>`;
}

function getCorClass(tag) {
    const mapa = { 'ANIMAL': 'ong-azul', 'SOCIAL': 'ong-vermelho', 'AMBIENTE': 'ong-verde' };
    return mapa[tag] || 'ong-amarelo';
}

// ==============================================================
// 4. AÇÕES (Remover Favorito)
// ==============================================================
window.removerFavorito = async function(ongId, btn, event) {
    event.stopPropagation(); // Não abre o card ao clicar no coração

    if (!confirm('Remover dos favoritos?')) return;

    const cpf = localStorage.getItem('usuarioLogado');
    
    try {
        const response = await fetch(`${URL_BASE}/toggle-favorito`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                "ngrok-skip-browser-warning": "true" 
            },
            body: JSON.stringify({ cpf, ongId })
        });

        if (response.ok) {
            // Remove o card visualmente
            const card = btn.closest('.ong-card');
            card.style.opacity = '0';
            card.style.transform = 'scale(0.8)';
            
            setTimeout(() => {
                card.remove();
                // Se não sobrou nenhum card, mostra vazio
                if (!document.querySelector('.ong-card')) mostrarEstadoVazio();
            }, 300);
        } else {
            alert("Erro ao atualizar favorito.");
        }
    } catch (e) {
        console.error(e);
        alert("Erro de conexão.");
    }
};

// ==============================================================
// 5. SIDEBAR E PERFIL
// ==============================================================
function atualizarInterfaceUsuario(perfil) {
    const nome = perfil.nome ? perfil.nome.split(' ')[0] : 'Usuário';
    const foto = perfil.foto || 'imagens/usuario.png';

    const elsNome = document.querySelectorAll('#greeting-name, #sidebar-nome');
    const elsFoto = document.querySelectorAll('.profile-pic, #sidebar-foto');

    elsNome.forEach(el => el.textContent = `Olá, ${nome}!`);
    elsFoto.forEach(el => el.src = foto);
}

function inicializarSidebar() {
    const btn = document.querySelector('.profile-info');
    const sb = document.getElementById('sidebar-perfil');
    const ov = document.getElementById('sidebar-overlay');
    const close = document.getElementById('btn-fechar-sidebar');
    const sair = document.querySelector('.sidebar-sair a');

    const toggle = (s) => {
        if(sb) sb.classList.toggle('ativo', s);
        if(ov) ov.classList.toggle('ativo', s);
    };

    if(btn) btn.addEventListener('click', (e) => { e.stopPropagation(); toggle(true); });
    if(close) close.addEventListener('click', () => toggle(false));
    if(ov) ov.addEventListener('click', () => toggle(false));
    if(sair) sair.addEventListener('click', () => localStorage.removeItem('usuarioLogado'));
}

// ==============================================================
// 6. ALTO CONTRASTE
// ==============================================================
function inicializarAltoContraste() {
    const btn = document.getElementById('toggle-alto-contraste');
    const body = document.body;
    
    if (localStorage.getItem('altoContraste') === 'ativado') body.classList.add('daltonismo-mode');

    if (btn) {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            body.classList.toggle('daltonismo-mode');
            if(body.classList.contains('daltonismo-mode')) localStorage.setItem('altoContraste', 'ativado');
            else localStorage.removeItem('altoContraste');
        });
    }
}

// ==============================================================
// 7. INICIALIZAÇÃO
// ==============================================================
document.addEventListener('DOMContentLoaded', () => {
    carregarOngsFavoritas();
    inicializarSidebar();
    inicializarAltoContraste();
});