// ==============================================================
// 1. CONFIGURAÇÃO INICIAL (CRÍTICO: NÃO APAGUE ESTAS LINHAS)
// ==============================================================

// Define a URL base. Se o config.js falhar, usa localhost como reserva.
const URL_BASE = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://localhost:1880';
// Configuração para o Ngrok não travar (o "Crachá VIP")
const headersNgrok = {
    headers: new Headers({ "ngrok-skip-browser-warning": "true" })
};

let categoriaAtual = 'TODAS'; // Estado global da categoria

console.log("Carregando telainicial.js com servidor:", URL_BASE);

// ==============================================================
// 2. FUNÇÕES UTILITÁRIAS
// ==============================================================

function inicializarSetasCarrossel() {
    const carrossel = document.querySelector('.carrossel-ongs');
    const btnEsq = document.getElementById('btn-carrossel-esq');
    const btnDir = document.getElementById('btn-carrossel-dir');
    
    if (!carrossel) return; // Se não achar o carrossel, para aqui.

    if (btnEsq) {
        btnEsq.addEventListener('click', () => {
            carrossel.scrollBy({ left: -300, behavior: 'smooth' });
        });
    }
    
    if (btnDir) {
        btnDir.addEventListener('click', () => {
            carrossel.scrollBy({ left: 300, behavior: 'smooth' });
        });
    }
}

function inicializarSetasCarrosselUsuarios() {
    const scrollContainer = document.getElementById('carrossel-users-scroll');
    const btnEsq = document.getElementById('btn-users-esq');
    const btnDir = document.getElementById('btn-users-dir');

    if (btnEsq && btnDir && scrollContainer) {
        btnEsq.addEventListener('click', () => scrollContainer.scrollBy({ left: -220, behavior: 'smooth' }));
        btnDir.addEventListener('click', () => scrollContainer.scrollBy({ left: 220, behavior: 'smooth' }));
    }
}

// ==============================================================
// 3. RENDERIZAÇÃO (DESENHAR NA TELA)
// ==============================================================

// Renderiza Cards de ONGs
function renderizarCardsOngs(ongs) {
    const container = document.getElementById('lista-ongs');
    if (!container) return;
    container.innerHTML = '';

    if (!ongs || ongs.length === 0) {
        container.innerHTML = '<div style="padding:20px; color:#666; width:100%; text-align:center;">Nenhuma ONG encontrada.</div>';
        return;
    }

    const coresCards = ['card-azul', 'card-vermelho', 'card-amarelo', 'card-verde'];

    ongs.forEach((ong, index) => {
        const corClass = coresCards[index % coresCards.length];
        const logoUrl = ong.logo_url || 'https://placehold.co/150?text=ONG';
        const local = ong.localizacao_curta || 'Brasil';
        
        const html = `
            <div class="card-ong ${corClass}" onclick="window.location.href='infoong.html?id=${ong.id}'">
                <div class="card-logo">
                    <img src="${logoUrl}" alt="${ong.nome}" onerror="this.src='https://placehold.co/150?text=Logo'">
                </div>
                <div class="card-info">
                    <div>
                        <h3>${ong.nome}</h3>
                        <p class="card-info-local"><i class="fa-solid fa-location-dot"></i> ${local}</p>
                    </div>
                    <div class="card-footer">
                        <span>Ver detalhes</span>
                        <div class="btn-card-arrow"><i class="fa-solid fa-arrow-right"></i></div>
                    </div>
                </div>
            </div>`;
        container.insertAdjacentHTML('beforeend', html);
    });
    
    inicializarSetasCarrossel();
}

// Renderiza Cards de Usuários
function renderizarCarrosselUsuarios(usuarios) {
    const container = document.getElementById('lista-usuarios-carrossel');
    if (!container) return;
    container.innerHTML = '';

    if (!usuarios || usuarios.length === 0) {
        const secUsuarios = document.getElementById('sec-usuarios'); 
        if(secUsuarios) secUsuarios.style.display = 'none'; 
        return;
    }

    const secUsuarios = document.getElementById('sec-usuarios');
    if(secUsuarios) secUsuarios.style.display = 'block';

    usuarios.forEach(user => {
        const nome = user.nome ? user.nome.split(' ')[0] : 'Usuário';
        const foto = (user.foto && user.foto.length > 20) ? user.foto : `https://placehold.co/80/2729af/ffffff?text=${nome[0]}`;
        
        const html = `
            <div class="card-usuario-carrossel" onclick="window.location.href='perfilpublico.html?cpf=${user.cpf}'">
                <img src="${foto}" class="card-usuario-img" onerror="this.src='https://placehold.co/80?text=U'">
                <h4 class="card-usuario-nome">${nome}</h4>
                <button class="btn-ver-perfil-sm">Ver Perfil</button>
            </div>`;
        container.insertAdjacentHTML('beforeend', html);
    });
    inicializarSetasCarrosselUsuarios();
}

// Renderiza Feed
function renderizarFeed(todosPosts) {
    const container = document.getElementById('postagens-container');
    if (!container) return;
    
    container.innerHTML = '';

    if (!todosPosts || todosPosts.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:40px; color:#999; grid-column: 1/-1;">Nenhuma postagem encontrada.</p>';
        return;
    }

    todosPosts.forEach(item => {
        const post = item.post;
        const verificado = item.tipo === 'ONG' ? '<i class="fa-solid fa-circle-check" style="color:#2729af; font-size:12px; margin-left:5px;"></i>' : '';
        
        const imgAutor = item.autorFoto || 'https://placehold.co/50x50/2729af/ffffff?text=U';
        const imgPost = post.foto_post || post.imagem || 'https://placehold.co/600x400?text=Imagem';

        let linkPerfil = '#';
        if (item.tipo === 'ONG') linkPerfil = `infoong.html?id=${item.autorId}`;
        if (item.tipo === 'USER') linkPerfil = `perfilpublico.html?cpf=${item.autorId}`;

        const html = `
            <div class="card-postagem" onclick="window.location.href='detalhepost.html?postId=${post.id_post}&origem=${item.tipo}&idAutor=${item.autorId}'">
                <div class="card-postagem-header">
                    <img src="${imgAutor}" class="post-ong-logo" onerror="this.src='https://placehold.co/50x50?text=U'">
                    <div class="post-ong-info">
                        <span class="post-ong-nome" onclick="event.stopPropagation(); window.location.href='${linkPerfil}'" style="cursor:pointer;">
                            ${item.autorNome} ${verificado}
                        </span>
                        <span class="post-data">Visualizar postagem</span>
                    </div>
                </div>
                <div class="card-postagem-media">
                    <img src="${imgPost}" alt="Postagem" onerror="this.src='https://placehold.co/600x400?text=Erro'">
                </div>
                <div class="card-postagem-conteudo">
                    <p><strong>${item.autorNome.split(' ')[0]}:</strong> ${post.descricao_post || '...'}</p>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    });
}

// ==============================================================
// 4. CARREGAMENTO DE DADOS (API)
// ==============================================================

async function carregarTudoEFiltrar() {
    const inputBusca = document.querySelector('.pesquisa input');
    const termo = inputBusca ? inputBusca.value.toLowerCase().trim() : "";
    const cpfLogado = localStorage.getItem('usuarioLogado');

    try {
        // Busca ONGs e Usuários em paralelo
        const [resOngs, resUsers] = await Promise.all([
            fetch(`${URL_BASE}/ongs`, headersNgrok),
            fetch(`${URL_BASE}/perfil?t=${Date.now()}`, headersNgrok)
        ]);

        const ongs = await resOngs.json();
        const usuarios = await resUsers.json();

        // Filtra ONGs
        let ongsFiltradas = categoriaAtual === 'TODAS' ? ongs : ongs.filter(ong => ong.cor_tag === categoriaAtual);
        if (termo.length > 0) {
            ongsFiltradas = ongsFiltradas.filter(ong => ong.nome.toLowerCase().includes(termo));
        }
        renderizarCardsOngs(ongsFiltradas);

        // Filtra Usuários (Remove o próprio usuário da lista)
        let usuariosFiltrados = Array.isArray(usuarios) ? usuarios.filter(u => u.cpf !== cpfLogado) : [];
        if (termo.length > 0) {
            usuariosFiltrados = usuariosFiltrados.filter(u => u.nome && u.nome.toLowerCase().includes(termo));
        }
        renderizarCarrosselUsuarios(usuariosFiltrados);

        // Monta o Feed
        let postsDoFeed = [];

        ongsFiltradas.forEach(ong => {
            if (ong.posts) {
                ong.posts.forEach(post => {
                    postsDoFeed.push({
                        tipo: 'ONG',
                        autorNome: ong.nome,
                        autorFoto: ong.logo_url,
                        autorId: ong.id,
                        post: post
                    });
                });
            }
        });

        usuariosFiltrados.forEach(user => {
            const postsUser = user.posters || user.posts;
            if (postsUser) {
                postsUser.forEach(post => {
                    postsDoFeed.push({
                        tipo: 'USER',
                        autorNome: user.nome,
                        autorFoto: user.foto,
                        autorId: user.cpf,
                        post: post
                    });
                });
            }
        });

        postsDoFeed.sort(() => Math.random() - 0.5);
        renderizarFeed(postsDoFeed);

    } catch (err) {
        console.error("Erro ao carregar dados:", err);
    }
}

// ==============================================================
// 5. PERFIL NO CABEÇALHO E SIDEBAR
// ==============================================================

async function carregarPerfilUsuario() {
    try {
        const cpf = localStorage.getItem('usuarioLogado');
        if(!cpf) return;

        const res = await fetch(`${URL_BASE}/perfil?t=${Date.now()}`, headersNgrok);
        const dados = await res.json();
        
        // Encontra o usuário específico
        const perfil = Array.isArray(dados) ? dados.find(u => u.cpf === cpf) : dados;
        
        if(perfil) {
            const nome = perfil.nome ? perfil.nome.split(' ')[0] : 'Usuário';
            const foto = (perfil.foto && perfil.foto.length > 20) ? perfil.foto : 'imagens/usuario.png';

            // Atualiza Header
            const elNomeHeader = document.getElementById('nome-usuario');
            const elFotoHeader = document.getElementById('foto-usuario');
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

function inicializarSidebar() {
    const btnUser = document.querySelector('.usuario');
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
    
    if(btnSair) {
        btnSair.addEventListener('click', () => {
            localStorage.removeItem('usuarioLogado');
            window.location.href = 'index.html';
        });
    }
}

// ==============================================================
// 6. FILTRO DE CATEGORIAS
// ==============================================================

async function inicializarFiltroCategorias() {
    const btnCategorias = document.querySelector('.categorias');
    const menuCategorias = document.getElementById('menu-categorias');
    
    if (!btnCategorias || !menuCategorias) return;

    try {
        const response = await fetch(`${URL_BASE}/ongs`, headersNgrok);
        const ongs = await response.json();
        const categoriasUnicas = [...new Set(ongs.map(ong => ong.cor_tag))].filter(Boolean).sort();
        
        menuCategorias.innerHTML = '';
        
        // Função auxiliar para criar item
        const criarItem = (cat, nome, icon, active = false) => {
            const div = document.createElement('div');
            div.className = `categoria-item ${active ? 'ativa' : ''}`;
            div.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${nome}</span>`;
            div.addEventListener('click', async () => {
                categoriaAtual = cat;
                document.querySelectorAll('.categoria-item').forEach(i => i.classList.remove('ativa'));
                div.classList.add('ativa');
                menuCategorias.classList.remove('ativo');
                await carregarTudoEFiltrar();
            });
            return div;
        };

        // Item "Todas"
        menuCategorias.appendChild(criarItem('TODAS', 'Todas', 'fa-th', true));

        // Outras categorias
        categoriasUnicas.forEach(cat => {
            // Mapa simples de ícones
            let icon = 'fa-tag';
            if(cat === 'SOCIAL') icon = 'fa-hand-holding-heart';
            if(cat === 'ANIMAL') icon = 'fa-paw';
            if(cat === 'AMBIENTE') icon = 'fa-leaf';
            if(cat === 'SAUDE') icon = 'fa-heartbeat';
            
            menuCategorias.appendChild(criarItem(cat, cat, icon));
        });
        
        btnCategorias.addEventListener('click', (e) => {
            e.stopPropagation();
            menuCategorias.classList.toggle('ativo');
        });

        document.addEventListener('click', (e) => {
            if (!btnCategorias.contains(e.target) && !menuCategorias.contains(e.target)) {
                menuCategorias.classList.remove('ativo');
            }
        });
        
    } catch (err) { console.error(err); }
}

// ==============================================================
// 7. ALTO CONTRASTE
// ==============================================================

function inicializarAltoContraste() {
    const toggleBtn = document.getElementById('toggle-alto-contraste');
    const body = document.body;

    // 1. Verifica memória
    if (localStorage.getItem('altoContraste') === 'ativado') {
        body.classList.add('daltonismo-mode');
    }

    // 2. Clique
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function(event) {
            event.preventDefault(); 
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
// 8. INICIALIZAÇÃO GERAL
// ==============================================================

document.addEventListener('DOMContentLoaded', () => {
    // Carrega tudo
    carregarTudoEFiltrar();
    carregarPerfilUsuario();
    inicializarSidebar();
    inicializarFiltroCategorias();
    inicializarAltoContraste();

    // Busca com delay (debounce)
    const inputBusca = document.querySelector('.pesquisa input');
    if (inputBusca) {
        let timeoutBusca;
        inputBusca.addEventListener('input', () => {
            clearTimeout(timeoutBusca);
            timeoutBusca = setTimeout(() => carregarTudoEFiltrar(), 500);
        });
    }
});