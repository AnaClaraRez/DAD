/**
 * perfilpublico.js
 * Gerencia a visualização do perfil de outros usuários.
 */

// ==============================================================
// 1. CONFIGURAÇÃO
// ==============================================================
const URL_BASE = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://localhost:1880';const placeholderImg = "https://placehold.co/120/2729af/ffffff?text=U";

// Headers para GET (pular aviso Ngrok)
const headersGet = {
    headers: new Headers({ "ngrok-skip-browser-warning": "true" })
};

// Headers para POST (JSON + Ngrok)
const headersPost = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true"
};

let usuarioVisitado = null;
let meuObjetoUsuario = null;

// ==============================================================
// 2. CARREGAMENTO GERAL
// ==============================================================
async function inicializarPagina() {
    try {
        // Usa headersGet
        const response = await fetch(`${URL_BASE}/perfil?t=${Date.now()}`, headersGet);
        const perfis = await response.json();
        
        const cpfLogado = localStorage.getItem('usuarioLogado');
        const params = new URLSearchParams(window.location.search);
        const cpfVisitado = params.get('cpf');

        // 1. Identificar Usuário Logado
        if (cpfLogado && Array.isArray(perfis)) {
            meuObjetoUsuario = perfis.find(u => u.cpf === cpfLogado);
            if (meuObjetoUsuario) atualizarHeaderEBarra(meuObjetoUsuario);
        }

        // 2. Identificar Usuário Visitado (da URL)
        if (cpfVisitado) {
            if (cpfLogado && cpfVisitado === cpfLogado) {
                window.location.href = "meuperfil.html"; // Redireciona se for o próprio
                return;
            }

            usuarioVisitado = perfis.find(u => u.cpf === cpfVisitado);
            
            if (usuarioVisitado) {
                preencherPerfilPublico(usuarioVisitado);
                verificarStatusSeguir();
            } else {
                alert("Usuário não encontrado.");
                window.location.href = "telainicial.html";
            }
        }
    } catch(e) { console.error("Erro ao carregar dados:", e); }
}

// ==============================================================
// 3. PREENCHIMENTO DA TELA
// ==============================================================
function preencherPerfilPublico(user) {
    document.getElementById('pub-nome').textContent = user.nome;
    document.getElementById('pub-bio').textContent = user.descricao_perfil || "Sem descrição.";
    
    const numSeguidores = Array.isArray(user.seguidores) ? user.seguidores.length : 0;
    const numSeguindo = Array.isArray(user.seguindo) ? user.seguindo.length : 0;

    document.getElementById('pub-seguidores').textContent = numSeguidores;
    document.getElementById('pub-seguindo').textContent = numSeguindo;
    document.getElementById('pub-doacoes').textContent = user.quantidade_doacoes || 0;
    
    const foto = (user.foto && user.foto.length > 50) ? user.foto : placeholderImg;
    const elPubFoto = document.getElementById('pub-foto');
    if(elPubFoto) {
        elPubFoto.src = foto;
        elPubFoto.onerror = function() { this.src = placeholderImg; };
    }

    const grid = document.getElementById('pub-postagens-grid');
    grid.innerHTML = ''; // Limpa antes de renderizar

    if (user.posters && user.posters.length > 0) {
        // Gera o link para a página de feed de posts
        const postsFeedLink = `posters.html?cpf=${user.cpf}`;
        
        user.posters.forEach(post => {
            const imgUrl = post.imagem || post.foto_post || post; 
            const html = `
                <div class="post-item" onclick="window.location.href='${postsFeedLink}'">
                    <img src="${imgUrl}" alt="Postagem" onerror="this.src='https://placehold.co/300?text=Imagem'">
                </div>`;
            grid.insertAdjacentHTML('beforeend', html);
        });
    } else {
        grid.innerHTML = `<div class="empty-posts" style="grid-column: 1 / -1;"><i class="fa-solid fa-camera"></i><h3>Nenhuma publicação</h3></div>`;
    }
}

function atualizarHeaderEBarra(perfil) {
    const nome = perfil.nome.split(' ')[0];
    const foto = (perfil.foto && perfil.foto.length > 50) ? perfil.foto : 'imagens/usuario.png';
    
    document.getElementById('greeting-name').textContent = `Olá, ${nome}!`;
    document.getElementById('header-foto').src = foto;
    document.getElementById('sidebar-nome').textContent = `Olá, ${nome}`;
    document.getElementById('sidebar-foto').src = foto;
}

// ==============================================================
// 4. LÓGICA DO BOTÃO SEGUIR
// ==============================================================
function verificarStatusSeguir() {
    const btnSeguir = document.getElementById('btn-seguir-publico');
    if (!meuObjetoUsuario || !usuarioVisitado || !btnSeguir) return;

    // Checa se o CPF do visitado está na lista de 'seguindo' do usuário logado
    if (meuObjetoUsuario.seguindo && meuObjetoUsuario.seguindo.includes(usuarioVisitado.cpf)) {
        btnSeguir.classList.add('seguindo');
        btnSeguir.innerHTML = '<i class="fa-solid fa-check"></i> Seguindo';
    } else {
        btnSeguir.classList.remove('seguindo');
        btnSeguir.innerHTML = '<i class="fa-solid fa-user-plus"></i> Seguir';
    }
}

function inicializarBotoesAcao() {
    const btnSeguir = document.getElementById('btn-seguir-publico');
    const btnMensagem = document.getElementById('btn-mensagem-publico');

    // --- SEGUIR ---
    if (btnSeguir) {
        btnSeguir.addEventListener('click', async () => {
            const cpfLogado = localStorage.getItem('usuarioLogado');

            if (!cpfLogado) return alert("Faça login para seguir.");

            // Impede cliques repetidos antes da resposta
            if (btnSeguir.classList.contains('seguindo')) return;

            const textoOriginal = btnSeguir.innerHTML;
            btnSeguir.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            btnSeguir.disabled = true;

            try {
                const response = await fetch(`${URL_BASE}/seguir-usuario`, {
                    method: 'POST',
                    headers: headersPost, // Usa headers corrigidos
                    body: JSON.stringify({
                        seguidor: cpfLogado,
                        seguido: usuarioVisitado.cpf
                    })
                });

                if (response.ok) {
                    btnSeguir.classList.add('seguindo');
                    btnSeguir.innerHTML = '<i class="fa-solid fa-check"></i> Seguindo';
                    
                    // Atualiza contador na tela (+1)
                    const elSeguidores = document.getElementById('pub-seguidores');
                    if(elSeguidores) {
                        let atual = parseInt(elSeguidores.textContent) || 0;
                        elSeguidores.textContent = atual + 1;
                    }

                    // Envia Notificação (Assumindo que essa função existe no seu projeto)
                    if (typeof window.enviarNotificacao === 'function') {
                        window.enviarNotificacao(usuarioVisitado.cpf, "começou a seguir você.", "seguir");
                    }

                } else {
                    throw new Error("Erro no servidor");
                }
            } catch (error) {
                console.error("Erro ao seguir:", error);
                alert("Erro ao tentar seguir. Tente novamente.");
                btnSeguir.innerHTML = textoOriginal;
            } finally {
                btnSeguir.disabled = false;
            }
        });
    }

    // --- MENSAGEM ---
    if (btnMensagem) {
        btnMensagem.addEventListener('click', () => {
            if (usuarioVisitado) {
                const nomeCodificado = encodeURIComponent(usuarioVisitado.nome);
                window.location.href = `chat.html?destinatario=${usuarioVisitado.cpf}&nome=${nomeCodificado}`;
            }
        });
    }
}

// ==============================================================
// 5. SIDEBAR E ALTO CONTRASTE
// ==============================================================
function inicializarSidebar() {
    const btnUsuario = document.querySelector('.profile-info');
    const sidebar = document.getElementById('sidebar-perfil');
    const overlay = document.getElementById('sidebar-overlay');
    const btnFechar = document.getElementById('btn-fechar-sidebar');
    const btnSair = document.querySelector('.sidebar-sair a');

    const toggle = (st) => {
        if(st) { sidebar.classList.add('ativo'); overlay.classList.add('ativo'); }
        else { sidebar.classList.remove('ativo'); overlay.classList.remove('ativo'); }
    };

    if(btnUsuario) btnUsuario.addEventListener('click', (e) => { e.stopPropagation(); toggle(true); });
    if(btnFechar) btnFechar.addEventListener('click', () => toggle(false));
    if(overlay) overlay.addEventListener('click', () => toggle(false));
    if(btnSair) btnSair.addEventListener('click', () => localStorage.removeItem('usuarioLogado'));
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
// 6. INICIALIZAÇÃO
// ==============================================================
document.addEventListener('DOMContentLoaded', () => {
    // Inicializa a página principal e o perfil do logado (MeuPerfil)
    inicializarPagina();
    // Inicializa a sidebar
    inicializarSidebar();
    // Inicializa os botões de seguir/mensagem (depende do inicializarPagina carregar os usuários)
    inicializarBotoesAcao();
    // Inicializa Alto Contraste
    inicializarAltoContraste();
});