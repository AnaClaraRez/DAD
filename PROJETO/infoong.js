/**
 * infoong.js
 * Gerencia a página de detalhes da ONG, interações e carregamento de dados.
 */

// 1. CONFIGURAÇÃO
const URL_BASE = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://localhost:1880';
// Headers para passar pelo Ngrok
const headersNgrok = {
    headers: new Headers({ "ngrok-skip-browser-warning": "true" })
};

let perfilAtual = null;

function getOngIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// ==============================================================
// 2. CARREGAR DADOS (PERFIL + ONG)
// ==============================================================
// Correção para infoong.js
async function carregarPerfilUsuario() {
    try {
        // 1. Obtém o CPF do usuário logado
        const cpf = localStorage.getItem('usuarioLogado');
        if(!cpf) return; // Sai se não houver CPF logado

        // 2. Busca todos os perfis
        const response = await fetch(`${URL_BASE}/perfil`);
        const dados = await response.json();
        
        // 3. Encontra o usuário específico pelo CPF
        const perfil = Array.isArray(dados) ? dados.find(u => u.cpf === cpf) : dados;
        
        if(perfil) {
            const nome = perfil.nome ? perfil.nome.split(' ')[0] : 'Usuário';
            // Usa foto de placeholder se a foto não for válida (muito curta)
            const foto = (perfil.foto && perfil.foto.length > 20) ? perfil.foto : 'imagens/usuario.png';

            // Atualiza Header
            const elNomeHeader = document.getElementById('greeting-name');
            const elFotoHeader = document.querySelector('.profile-pic');
            if(elNomeHeader) elNomeHeader.textContent = `Olá, ${nome}!`;
            if(elFotoHeader) elFotoHeader.src = foto;

            // Atualiza Sidebar
            const elNomeSidebar = document.getElementById('sidebar-nome');
            const elFotoSidebar = document.getElementById('sidebar-foto');
            if(elNomeSidebar) elNomeSidebar.textContent = `Olá, ${nome}`;
            if(elFotoSidebar) elFotoSidebar.src = foto;
        }
    } catch(e) { 
        console.error("Erro ao carregar perfil:", e); 
    }
}

function actualizarInterfaceUsuario(perfil) {
    const primeiroNome = perfil.nome.split(' ')[0];
    const fotoUrl = perfil.foto || 'imagens/usuario.png';

    // Header
    const greetingName = document.getElementById('greeting-name');
    const profilePic = document.querySelector('.profile-pic'); // Foto no header
    if (greetingName) greetingName.textContent = `Olá, ${primeiroNome}!`;
    if (profilePic) profilePic.src = fotoUrl;

    // Sidebar
    const sidebarNome = document.getElementById('sidebar-nome');
    const sidebarFoto = document.getElementById('sidebar-foto');
    if (sidebarNome) sidebarNome.textContent = `Olá, ${primeiroNome}`;
    if (sidebarFoto) sidebarFoto.src = fotoUrl;
}

async function carregarDadosOng() {
    const ongId = getOngIdFromUrl();
    if (!ongId) {
        alert("ONG não encontrada.");
        window.location.href = "todasongs.html";
        return;
    }

    try {
        const response = await fetch(`${URL_BASE}/ongs`, headersNgrok);
        const ongs = await response.json();
        const ong = ongs.find(o => o.id == ongId);
        
        if (!ong) {
            document.querySelector('.perfil-ong-content').innerHTML = '<p>ONG não encontrada.</p>';
            return;
        }

        // Preenche a tela
        document.getElementById('ong-name').textContent = ong.nome;
        document.getElementById('ong-logo').src = ong.logo_url || 'https://placehold.co/150';
        
        const localizacao = ong.localizacao_completa || ong.localizacao_curta || 'Brasil';
        document.getElementById('ong-location').innerHTML = `<i class="fa-solid fa-location-dot"></i> ${localizacao}`;
        
        const ongMission = document.querySelector('.ong-mission');
        if (ongMission) ongMission.innerHTML = `"${ong.descricao || 'Sem descrição.'}" <i class="fa-solid fa-heart"></i>`;
        
        if (ong.verificado) {
            const verifiedIcon = document.getElementById('ong-verified-icon');
            if(verifiedIcon) verifiedIcon.style.display = 'inline-block';
        }

        // Estatísticas Fictícias (ou reais se tiver no JSON)
        document.getElementById('stat-followers').textContent = '3.4k';
        document.getElementById('stat-members').textContent = '32';
        document.getElementById('stat-following').textContent = '144';

        carregarPostagens(ong);
        configurarBotaoTransparencia(ong);

    } catch (err) {
        console.error('Erro ao carregar ONG:', err);
    }
}

// ==============================================================
// 3. POSTAGENS DA ONG
// ==============================================================
function carregarPostagens(ong) {
    const postsContainer = document.getElementById('posts-grid-container');
    if (!postsContainer) return;
    
    postsContainer.innerHTML = '';

    if (ong.posts && ong.posts.length > 0) {
        // Inverte para mostrar os mais recentes primeiro
        const posts = [...ong.posts].reverse();
        
        posts.forEach(post => {
            const img = post.foto_post || post.imagem || 'https://placehold.co/400';
            const desc = post.descricao_post || post.descricao || '';
            
            const postHtml = `
                <div class="post-card">
                    <img src="${img}" alt="Post" class="post-image">
                    <div class="post-info">
                        <p class="post-description">${desc}</p>
                        <div class="post-stats">
                            <span><i class="fa-solid fa-heart"></i> ${post.curtidas || 0}</span>
                            <span><i class="fa-solid fa-comment"></i> ${post.comentarios ? post.comentarios.length : 0}</span>
                        </div>
                    </div>
                </div>`;
            postsContainer.insertAdjacentHTML('beforeend', postHtml);
        });
    } else {
        postsContainer.innerHTML = '<p style="text-align:center; color:#666; padding:40px; grid-column: 1/-1;">Esta ONG ainda não fez publicações.</p>';
    }
}

// ==============================================================
// 4. AÇÕES (BOTÕES)
// ==============================================================

// Botão Transparência (PDF)
function configurarBotaoTransparencia(ong) {
    const btn = document.querySelector('.trans-btn');
    if (!btn) return;

    // Remove listeners antigos
    const novoBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(novoBtn, btn);

    novoBtn.addEventListener('click', () => {
        if (ong.transparencia_url) {
            const link = document.createElement('a');
            link.href = ong.transparencia_url;
            link.download = `Transparencia - ${ong.nome}.pdf`;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert("Documento de transparência não disponível.");
        }
    });
}

// Botão Seguir (Visual)
function inicializarBotaoSeguir() {
    const btnSeguir = document.querySelector('.follow-btn');
    if (btnSeguir) {
        btnSeguir.addEventListener('click', function() {
            this.classList.toggle('seguindo');
            if (this.classList.contains('seguindo')) {
                this.innerHTML = '<i class="fa-solid fa-check"></i> Seguindo';
            } else {
                this.innerHTML = '<i class="fa-solid fa-plus"></i> Seguir';
            }
        });
    }
}

// Favoritar (Coração)
function checarSeFavorito(perfil) {
    const ongId = getOngIdFromUrl();
    const btn = document.getElementById('favorite-icon');
    if (!btn) return;

    // Converte para string para comparar IDs
    if (perfil.ongs_favoritas && perfil.ongs_favoritas.some(id => String(id) === String(ongId))) {
        btn.innerHTML = '<i class="fa-solid fa-heart"></i>';
        btn.style.color = '#E34F4F';
        btn.dataset.favoritado = "true";
    } else {
        btn.innerHTML = '<i class="fa-regular fa-heart"></i>';
        btn.style.color = '#666';
        btn.dataset.favoritado = "false";
    }
}

function inicializarBotaoFavoritar() {
    const btn = document.getElementById('favorite-icon');
    if (!btn) return;
    
    btn.addEventListener('click', async () => {
        const cpf = localStorage.getItem('usuarioLogado');
        const ongId = getOngIdFromUrl();

        if (!cpf) return alert("Faça login para favoritar.");

        // Toggle Visual
        const isFav = btn.dataset.favoritado === "true";
        if (!isFav) {
            btn.innerHTML = '<i class="fa-solid fa-heart"></i>';
            btn.style.color = '#E34F4F';
            btn.dataset.favoritado = "true";
        } else {
            btn.innerHTML = '<i class="fa-regular fa-heart"></i>';
            btn.style.color = '#666';
            btn.dataset.favoritado = "false";
        }

        // Backend
        try {
            await fetch(`${URL_BASE}/toggle-favorito`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    "ngrok-skip-browser-warning": "true" 
                },
                body: JSON.stringify({ cpf, ongId })
            });
        } catch (e) {
            console.error("Erro ao favoritar:", e);
            // Opcional: Reverter visual em caso de erro
        }
    });
}

// Botão Doar (Redireciona para Tela de Doação)
function inicializarBotaoDoar() {
    const btn = document.querySelector('.donate-btn');
    if (btn) {
        btn.addEventListener('click', () => {
            const id = getOngIdFromUrl();
            window.location.href = `teladoacao.html?id=${id}`;
        });
    }
}

// Botão Mensagem (Redireciona para Chat)
function inicializarBotaoMensagem() {
    const btn = document.querySelector('.message-btn');
    if (btn) {
        btn.addEventListener('click', () => {
            const id = getOngIdFromUrl();
            const nome = document.getElementById('ong-name').textContent;
            window.location.href = `chat.html?destinatario=${id}&nome=${encodeURIComponent(nome)}`;
        });
    }
}

// ==============================================================
// 5. SIDEBAR E ALTO CONTRASTE
// ==============================================================
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
// INICIALIZAÇÃO
// ==============================================================
document.addEventListener('DOMContentLoaded', () => {
    carregarPerfilUsuario();
    carregarDadosOng();
    
    inicializarSidebar();
    inicializarAltoContraste();
    
    inicializarBotaoSeguir();
    inicializarBotaoFavoritar();
    inicializarBotaoDoar();
    inicializarBotaoMensagem();
});