/**
 * detalhepost.js - Versão Corrigida
 * Gerencia o feed de postagens, comentários e interações
 */

// ==============================================================
// 1. CONFIGURAÇÃO
// ==============================================================
const URL_BASE = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://localhost:1880';
const headersGet = {
    headers: new Headers({ "ngrok-skip-browser-warning": "true" })
};

const headersPost = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true"
};

// ==============================================================
// 2. UTILITÁRIOS
// ==============================================================
function obterParametroUrl(nome) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(nome);
}

function formatarData(dataString) {
    if (!dataString) return 'Recente';
    const data = new Date(dataString);
    const agora = new Date();
    const diff = Math.floor((agora - data) / 1000);

    if (diff < 60) return 'Agora';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

// ==============================================================
// 3. CARREGAR POSTS (FEED COMPLETO)
// ==============================================================
async function carregarTodosPosts() {
    const feedContainer = document.getElementById('feed-posts');
    if (!feedContainer) return;

    const postIdSelecionado = obterParametroUrl('postId');
    const origemSelecionada = obterParametroUrl('origem');
    const idAutorSelecionado = obterParametroUrl('idAutor');

    try {
        // Buscar ONGs e Usuários
        const [resOngs, resUsers] = await Promise.all([
            fetch(`${URL_BASE}/ongs`, headersGet),
            fetch(`${URL_BASE}/perfil?t=${Date.now()}`, headersGet)
        ]);

        const ongs = await resOngs.json();
        const usuarios = await resUsers.json();
        
        feedContainer.innerHTML = '';

        // Coletar todos os posts
        const todosOsPosts = [];

        // Posts de ONGs
        ongs.forEach(ong => {
            if (ong.posts && ong.posts.length > 0) {
                ong.posts.forEach(post => {
                    todosOsPosts.push({
                        tipo: 'ONG',
                        autorNome: ong.nome,
                        autorFoto: ong.logo_url,
                        autorId: ong.id,
                        autorLocal: ong.localizacao_curta || 'Brasil',
                        post: post
                    });
                });
            }
        });

        // Posts de Usuários
        if (Array.isArray(usuarios)) {
            usuarios.forEach(user => {
                const postsUser = user.posters || user.posts;
                if (postsUser && postsUser.length > 0) {
                    postsUser.forEach(post => {
                        todosOsPosts.push({
                            tipo: 'USER',
                            autorNome: user.nome,
                            autorFoto: user.foto,
                            autorId: user.cpf,
                            autorLocal: 'Usuário',
                            post: post
                        });
                    });
                }
            });
        }

        if (todosOsPosts.length === 0) {
            feedContainer.innerHTML = '<p style="text-align:center; color:#999; padding:40px;">Nenhum post disponível.</p>';
            return;
        }

        // Se tiver post específico selecionado, mostra ele primeiro
        if (postIdSelecionado && origemSelecionada && idAutorSelecionado) {
            const postSelecionado = todosOsPosts.find(p => 
                p.post.id_post === postIdSelecionado && 
                p.autorId === idAutorSelecionado &&
                p.tipo === origemSelecionada
            );

            if (postSelecionado) {
                // Remove do array e adiciona no início
                const index = todosOsPosts.indexOf(postSelecionado);
                todosOsPosts.splice(index, 1);
                todosOsPosts.unshift(postSelecionado);
            }
        } else {
            // Embaralha os posts
            todosOsPosts.sort(() => Math.random() - 0.5);
        }

        // Renderizar todos os posts
        todosOsPosts.forEach((item, index) => {
            const postHtml = criarHtmlPost(item, index);
            feedContainer.insertAdjacentHTML('beforeend', postHtml);
        });

        adicionarEventosAosPosts();

        // Scroll suave até o post selecionado
        if (postIdSelecionado) {
            setTimeout(() => {
                const postEl = document.querySelector(`[data-post-id="${postIdSelecionado}"]`);
                if (postEl) {
                    postEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    postEl.style.border = '3px solid #2729af';
                    setTimeout(() => postEl.style.border = 'none', 3000);
                }
            }, 300);
        }

    } catch (err) {
        console.error('Erro ao carregar posts:', err);
        feedContainer.innerHTML = '<p style="text-align:center; color:red; padding:40px;">Erro ao carregar os posts.</p>';
    }
}

// ==============================================================
// 4. CRIAR HTML DO POST
// ==============================================================
function criarHtmlPost(item, index) {
    const { tipo, autorNome, autorFoto, autorId, autorLocal, post } = item;
    
    const imgFallbackAutor = "https://placehold.co/40/2729af/ffffff?text=U";
    const imgFallbackPost = "https://placehold.co/600x400/f0f0f0/999999?text=Sem+Imagem";

    const fotoAutor = autorFoto || imgFallbackAutor;
    const fotoPost = post.foto_post || post.imagem || imgFallbackPost;

    // Link para perfil
    let linkPerfil = '#';
    if (tipo === 'ONG') linkPerfil = `infoong.html?id=${autorId}`;
    if (tipo === 'USER') linkPerfil = `perfilpublico.html?cpf=${autorId}`;

    // Ícone verificado para ONGs
    const verificado = tipo === 'ONG' 
        ? '<i class="fa-solid fa-circle-check" style="color:#2729af; font-size:12px; margin-left:5px;"></i>' 
        : '';

    // Renderiza Comentários
    const comentariosHtml = post.comentarios && post.comentarios.length > 0
        ? post.comentarios.map(c => `
            <div class="comentario-item">
                <img src="${c.foto_perfil || imgFallbackAutor}" 
                     class="foto-perfil-comentario-item" 
                     onerror="this.src='${imgFallbackAutor}'">
                <div class="conteudo-comentario">
                    <div class="header-comentario">
                        <span class="nome-comentario">${c.nome_perfil}</span>
                        <span class="data-comentario">${formatarData(c.data)}</span>
                    </div>
                    <p class="texto-comentario">${c.comentario}</p>
                </div>
            </div>`).join('')
        : '<p style="color:#999; text-align:center; padding:10px; font-size:13px;">Seja o primeiro a comentar!</p>';

    const iconeCurtida = post.curtido ? 'fa-solid' : 'fa-regular';
    const iconeSalvo = post.salvo ? 'fa-solid' : 'fa-regular';

    return `
        <div class="card-post-feed container-post" 
             data-post-id="${post.id_post}" 
             data-autor-id="${autorId}"
             data-tipo="${tipo}">
            
            <!-- Cabeçalho do Post -->
            <div class="card-post-content" style="display:flex; align-items:center; gap:10px; padding-bottom:15px; border-bottom:1px solid #f0f0f0;">
                <img src="${fotoAutor}" 
                     style="width:40px; height:40px; border-radius:50%; object-fit:cover; cursor:pointer;"
                     onclick="window.location.href='${linkPerfil}'"
                     onerror="this.src='${imgFallbackAutor}'">
                <div style="flex-grow:1;">
                    <div style="display:flex; align-items:center; gap:5px;">
                        <strong style="font-size:15px; color:#333; cursor:pointer;" 
                                onclick="window.location.href='${linkPerfil}'">${autorNome}</strong>
                        ${verificado}
                    </div>
                    <span style="font-size:12px; color:#999;">${autorLocal}</span>
                </div>
                <button class="btn-ver-ong" style="margin-left:auto;" onclick="window.location.href='${linkPerfil}'">
                    Ver Perfil
                </button>
            </div>
            
            <!-- Imagem do Post -->
            <img src="${fotoPost}" 
                 class="card-post-img" 
                 alt="Postagem"
                 onerror="this.src='${imgFallbackPost}'">
            
            <!-- Ações e Conteúdo -->
            <div class="acoes-post">
                <!-- Botões de Ação -->
                <div class="card-post-actions">
                    <button class="btn-acao btn-curtir" data-curtidas="${post.curtidas || 0}">
                        <i class="${iconeCurtida} fa-heart" style="color:${post.curtido ? '#ed4956' : '#333'}"></i>
                    </button>
                    <button class="btn-acao btn-comentar">
                        <i class="fa-regular fa-comment"></i>
                    </button>
                    <button class="btn-acao btn-salvar">
                        <i class="${iconeSalvo} fa-bookmark" style="color:${post.salvo ? '#2729af' : '#333'}"></i>
                    </button>
                </div>
                
                <!-- Contador de Curtidas -->
                <div class="contador-curtidas">${post.curtidas || 0} curtidas</div>
                
                <!-- Descrição -->
                <div class="descricao-post">
                    <strong>${autorNome.split(' ')[0]}</strong> ${post.descricao_post || '...'}
                </div>

                <!-- Seção de Comentários -->
                <div class="secao-comentarios">
                    <div class="lista-comentarios">
                        ${comentariosHtml}
                    </div>
                    <div class="form-comentario">
                        <input type="text" 
                               class="input-comentario" 
                               placeholder="Adicione um comentário...">
                        <button class="btn-enviar-comentario">Publicar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ==============================================================
// 5. INTERAÇÕES (CURTIR, COMENTAR, SALVAR)
// ==============================================================
function adicionarEventosAosPosts() {
    // Curtir
    document.querySelectorAll('.btn-curtir').forEach(btn => {
        btn.addEventListener('click', async () => {
            const container = btn.closest('.container-post');
            const icon = btn.querySelector('i');
            const contador = container.querySelector('.contador-curtidas');
            let qtd = parseInt(btn.dataset.curtidas);

            // Toggle visual
            if (icon.classList.contains('fa-regular')) {
                icon.classList.replace('fa-regular', 'fa-solid');
                icon.style.color = '#ed4956';
                qtd++;
            } else {
                icon.classList.replace('fa-solid', 'fa-regular');
                icon.style.color = '#333';
                qtd--;
            }
            
            btn.dataset.curtidas = qtd;
            contador.textContent = `${qtd} curtidas`;

            // Backend
            try {
                const tipo = container.dataset.tipo;
                const endpoint = tipo === 'ONG' ? `${URL_BASE}/atualizar-post` : `${URL_BASE}/atualizar-post-usuario`;
                
                await fetch(endpoint, {
                    method: 'POST',
                    headers: headersPost,
                    body: JSON.stringify({
                        autorId: container.dataset.autorId,
                        postId: container.dataset.postId,
                        campo: 'curtidas',
                        valor: qtd
                    })
                });
            } catch (e) { console.error('Erro ao curtir:', e); }
        });
    });

    // Salvar
    document.querySelectorAll('.btn-salvar').forEach(btn => {
        btn.addEventListener('click', () => {
            const icon = btn.querySelector('i');
            
            if (icon.classList.contains('fa-regular')) {
                icon.classList.replace('fa-regular', 'fa-solid');
                icon.style.color = '#2729af';
            } else {
                icon.classList.replace('fa-solid', 'fa-regular');
                icon.style.color = '#333';
            }
        });
    });

    // Comentar
    document.querySelectorAll('.btn-enviar-comentario').forEach(btn => {
        btn.addEventListener('click', () => adicionarComentario(btn));
    });

    // Enter para enviar comentário
    document.querySelectorAll('.input-comentario').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const btn = input.closest('.form-comentario').querySelector('.btn-enviar-comentario');
                adicionarComentario(btn);
            }
        });
    });

    // Focar no input ao clicar em comentar
    document.querySelectorAll('.btn-comentar').forEach(btn => {
        btn.addEventListener('click', () => {
            const container = btn.closest('.container-post');
            const input = container.querySelector('.input-comentario');
            input.focus();
        });
    });
}

// ==============================================================
// 6. ADICIONAR COMENTÁRIO
// ==============================================================
async function adicionarComentario(btn) {
    const container = btn.closest('.container-post');
    const input = container.querySelector('.input-comentario');
    const lista = container.querySelector('.lista-comentarios');
    const texto = input.value.trim();

    if (!texto) return;

    // Dados do usuário logado
    const nomeUser = document.getElementById('nome-usuario') 
        ? document.getElementById('nome-usuario').textContent.replace(/Olá,|!/g,'').trim() 
        : 'Você';
    const fotoUser = document.getElementById('foto-usuario') 
        ? document.getElementById('foto-usuario').src 
        : 'https://placehold.co/40/2729af/ffffff?text=U';

    // Novo comentário
    const novoHtml = `
        <div class="comentario-item">
            <img src="${fotoUser}" class="foto-perfil-comentario-item">
            <div class="conteudo-comentario">
                <div class="header-comentario">
                    <span class="nome-comentario">${nomeUser}</span>
                    <span class="data-comentario">Agora</span>
                </div>
                <p class="texto-comentario">${texto}</p>
            </div>
        </div>`;
    
    // Remove mensagem vazia
    if(lista.innerText.includes('Seja o primeiro')) {
        lista.innerHTML = '';
    }
    
    lista.insertAdjacentHTML('beforeend', novoHtml);
    input.value = '';
    lista.scrollTop = lista.scrollHeight;

    // Backend
    try {
        const tipo = container.dataset.tipo;
        const endpoint = tipo === 'ONG' 
            ? `${URL_BASE}/adicionar-comentario` 
            : `${URL_BASE}/adicionar-comentario-usuario`;
        
        await fetch(endpoint, {
            method: 'POST',
            headers: headersPost,
            body: JSON.stringify({
                autorId: container.dataset.autorId,
                postId: container.dataset.postId,
                comentario: {
                    nome_perfil: nomeUser,
                    foto_perfil: fotoUser,
                    comentario: texto,
                    data: new Date().toISOString()
                }
            })
        });
    } catch (e) { console.error('Erro ao comentar:', e); }
}

// ==============================================================
// 7. PERFIL E SIDEBAR
// ==============================================================
async function carregarPerfilUsuario() {
    const cpf = localStorage.getItem('usuarioLogado');
    if(!cpf) return;

    try {
        const res = await fetch(`${URL_BASE}/perfil?t=${Date.now()}`, headersGet);
        const dados = await res.json();
        const perfil = Array.isArray(dados) ? dados.find(u => u.cpf === cpf) : dados;

        if(perfil) {
            const nome = perfil.nome ? perfil.nome.split(' ')[0] : 'Usuário';
            const foto = (perfil.foto && perfil.foto.length > 20) 
                ? perfil.foto 
                : 'https://placehold.co/40/2729af/ffffff?text=' + nome[0];
            
            // Atualiza Header
            const elNome = document.getElementById('nome-usuario');
            const elFoto = document.getElementById('foto-usuario');
            if(elNome) elNome.textContent = `Olá, ${nome}!`;
            if(elFoto) elFoto.src = foto;
            
            // Atualiza Sidebar
            const elNomeSidebar = document.getElementById('sidebar-nome');
            const elFotoSidebar = document.getElementById('sidebar-foto');
            if(elNomeSidebar) elNomeSidebar.textContent = `Olá, ${nome}`;
            if(elFotoSidebar) elFotoSidebar.src = foto;
        }
    } catch(e) { 
        console.error('Erro ao carregar perfil:', e); 
    }
}

function inicializarSidebar() {
    const btn = document.querySelector('.usuario');
    const sb = document.getElementById('sidebar-perfil');
    const ov = document.getElementById('sidebar-overlay');
    const close = document.getElementById('btn-fechar-sidebar');
    const sair = document.querySelector('.sidebar-sair a');

    const toggle = (estado) => {
        if(sb) sb.classList.toggle('ativo', estado);
        if(ov) ov.classList.toggle('ativo', estado);
    };

    if(btn) btn.addEventListener('click', (e) => { 
        e.stopPropagation(); 
        toggle(true); 
    });
    
    if(close) close.addEventListener('click', () => toggle(false));
    if(ov) ov.addEventListener('click', () => toggle(false));
    
    if(sair) {
        sair.addEventListener('click', () => {
            localStorage.removeItem('usuarioLogado');
            window.location.href = 'index.html';
        });
    }
}

// ==============================================================
// 8. ALTO CONTRASTE
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
// 9. INICIALIZAÇÃO
// ==============================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('Carregando detalhepost.js com servidor:', URL_BASE);
    
    carregarPerfilUsuario();
    carregarTodosPosts();
    inicializarSidebar();
    inicializarAltoContraste();
});