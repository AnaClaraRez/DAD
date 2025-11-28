/**
 * meuperfil.js
 * Gerencia visualização, edição e criação de posts no perfil
 */

// ==============================================================
// 1. CONFIGURAÇÃO
// ==============================================================
const URL_BASE = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://localhost:1880';
// Headers para GET (apenas pular aviso)
const headersGet = {
    headers: new Headers({ "ngrok-skip-browser-warning": "true" })
};

// Headers para POST (JSON + pular aviso)
const headersPost = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true"
};

let perfilAtual = null;
let imagemPostBase64 = null; // Guarda a imagem do novo post

// ==============================================================
// 2. CARREGAR DADOS
// ==============================================================
async function carregarPerfilUsuario() {
    try {
        const cpfLogado = localStorage.getItem('usuarioLogado');
        if (!cpfLogado) {
            alert("Você precisa estar logado.");
            window.location.href = 'index.html'; 
            return;
        }

        // Adiciona headersGet para passar pelo Ngrok
        const response = await fetch(`${URL_BASE}/perfil?t=${Date.now()}`, headersGet);
        const dados = await response.json();
        
        // Encontra o usuário logado na lista ou objeto único
        if (Array.isArray(dados)) {
            perfilAtual = dados.find(u => u.cpf === cpfLogado);
        } else {
            if (dados.cpf === cpfLogado) perfilAtual = dados;
        }

        if (perfilAtual) {
            preencherTela(perfilAtual);
            atualizarSidebarEHeader(perfilAtual);
            carregarPostagens(perfilAtual);
        } else {
            console.error("Perfil não encontrado para o CPF logado.");
        }
    } catch (err) {
        console.error('Erro ao carregar perfil:', err);
    }
}

// ==============================================================
// 3. PREENCHIMENTO DA TELA
// ==============================================================
function preencherTela(perfil) {
    // Textos básicos
    const elNome = document.getElementById('perfil-nome');
    const elBio = document.getElementById('perfil-bio');
    if(elNome) elNome.textContent = perfil.nome || 'Usuário';
    if(elBio) elBio.textContent = perfil.descricao_perfil || "Sem descrição.";
    
    // Contadores
    const qtdSeguidores = Array.isArray(perfil.seguidores) ? perfil.seguidores.length : (perfil.seguidores || 0);
    const qtdSeguindo = Array.isArray(perfil.seguindo) ? perfil.seguindo.length : (perfil.seguindo || 0);
    const qtdDoacoes = perfil.quantidade_doacoes || 0;

    const elSeguidores = document.getElementById('num-seguidores') || document.getElementById('seguidores');
    const elSeguindo = document.getElementById('num-seguindo') || document.getElementById('seguindo');
    const elDoacoes = document.getElementById('num-doacoes') || document.getElementById('doacoes');

    if (elSeguidores) elSeguidores.textContent = formatarNumero(qtdSeguidores);
    if (elSeguindo) elSeguindo.textContent = qtdSeguindo;
    if (elDoacoes) elDoacoes.textContent = qtdDoacoes;
    
    // Foto Principal
    const fotoElement = document.getElementById('perfil-foto');
    if (fotoElement) {
        fotoElement.src = (perfil.foto && perfil.foto.length > 20) ? perfil.foto : 'imagens/usuario.png';
    }

    // Preenche Modal de Edição
    const editNome = document.getElementById('edit-nome');
    const editBio = document.getElementById('edit-bio');
    if (editNome) editNome.value = perfil.nome || '';
    if (editBio) editBio.value = perfil.descricao_perfil || '';
}

function formatarNumero(num) {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num;
}

function atualizarSidebarEHeader(perfil) {
    const primeiroNome = perfil.nome ? perfil.nome.split(' ')[0] : 'Usuário';
    const fotoUrl = (perfil.foto && perfil.foto.length > 20) ? perfil.foto : 'imagens/usuario.png';

    // Header
    const elGreeting = document.getElementById('greeting-name');
    const elHeaderPic = document.querySelector('.profile-pic') || document.getElementById('header-foto');
    if (elGreeting) elGreeting.textContent = `Olá, ${primeiroNome}!`;
    if (elHeaderPic) elHeaderPic.src = fotoUrl;

    // Sidebar
    const elSidebarName = document.getElementById('sidebar-nome');
    const elSidebarPic = document.getElementById('sidebar-foto');
    if (elSidebarName) elSidebarName.textContent = `Olá, ${primeiroNome}`;
    if (elSidebarPic) elSidebarPic.src = fotoUrl;
}

// --- POSTAGENS ---
function carregarPostagens(perfil) {
    const postagensGrid = document.getElementById('postagens-grid') || document.getElementById('meus-posts-grid');
    if (!postagensGrid) return;
    
    postagensGrid.innerHTML = '';

    if (perfil.posters && perfil.posters.length > 0) {
        // Inverte para mostrar recentes primeiro
        const postsReversos = [...perfil.posters].reverse();
        
        postsReversos.forEach(post => {
            // Suporte a objeto ou string antiga
            const imgUrl = post.foto_post || post.imagem || post;
            
            // Redireciona para detalhe do post
            const postHtml = `
                <div class="post-item" onclick="window.location.href='detalhepost.html?postId=${post.id_post || ''}&origem=USER&idAutor=${perfil.cpf}'" style="cursor: pointer;">
                    <img src="${imgUrl}" alt="Postagem" onerror="this.src='https://placehold.co/300?text=Erro'">
                </div>
            `;
            postagensGrid.insertAdjacentHTML('beforeend', postHtml);
        });
    } else {
        postagensGrid.innerHTML = `
            <div class="empty-posts" style="grid-column: 1 / -1; text-align: center; padding: 20px;">
                <i class="fa-solid fa-camera" style="font-size: 40px; color: #ccc;"></i>
                <h3 style="color: #666;">Nenhuma postagem ainda</h3>
                <p style="color: #999;">Compartilhe seus momentos!</p>
            </div>`;
    }
}

// ==============================================================
// 4. MODAIS (EDIÇÃO E NOVO POST)
// ==============================================================
function inicializarModais() {
    // --- EDIÇÃO PERFIL ---
    const modalEdit = document.getElementById('modal-editar');
    const btnAbrirEdit = document.getElementById('btn-abrir-modal');
    const btnFecharEdit = document.getElementById('btn-fechar-modal');
    const formEdit = document.getElementById('form-editar-perfil');

    if (modalEdit && btnAbrirEdit) {
        btnAbrirEdit.addEventListener('click', () => modalEdit.classList.add('ativo'));
        if (btnFecharEdit) btnFecharEdit.addEventListener('click', () => modalEdit.classList.remove('ativo'));
        
        if (formEdit) {
            formEdit.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const dadosNovos = {
                    cpf: perfilAtual.cpf,
                    nome: document.getElementById('edit-nome').value,
                    descricao: document.getElementById('edit-bio').value
                };

                try {
                    const btnSalvar = formEdit.querySelector('button');
                    const textoOriginal = btnSalvar.textContent;
                    btnSalvar.textContent = "Salvando...";
                    btnSalvar.disabled = true;

                    await fetch(`${URL_BASE}/update-meu-perfil`, {
                        method: 'POST', 
                        headers: headersPost, // Usa headers corrigidos
                        body: JSON.stringify(dadosNovos)
                    });
                    
                    alert("Perfil atualizado!");
                    modalEdit.classList.remove('ativo');
                    carregarPerfilUsuario(); // Recarrega

                    btnSalvar.textContent = textoOriginal;
                    btnSalvar.disabled = false;
                } catch (e) { 
                    console.error(e); 
                    alert("Erro ao atualizar."); 
                }
            });
        }
    }

    // --- NOVO POST ---
    const modalPost = document.getElementById('modal-postagem');
    const btnAbrirPost = document.querySelector('.btn-fazer-postagem');
    const btnFecharPost = document.getElementById('btn-fechar-postagem');
    const formPost = document.getElementById('form-criar-post');
    const inputFotoPost = document.getElementById('post-imagem-input');
    const previewPost = document.getElementById('preview-post');

    if (modalPost && btnAbrirPost) {
        btnAbrirPost.addEventListener('click', () => {
            if (formPost) formPost.reset();
            if (previewPost) {
                previewPost.style.display = 'none';
                previewPost.src = '';
            }
            imagemPostBase64 = null;
            modalPost.classList.add('ativo');
        });

        if (btnFecharPost) btnFecharPost.addEventListener('click', () => modalPost.classList.remove('ativo'));

        // Preview e Conversão
        if (inputFotoPost) {
            inputFotoPost.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(ev) {
                        if (previewPost) {
                            previewPost.src = ev.target.result;
                            previewPost.style.display = 'block';
                        }
                        imagemPostBase64 = ev.target.result; 
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // Enviar
        if (formPost) {
            formPost.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                if (!imagemPostBase64) {
                    alert("Por favor, escolha uma imagem.");
                    return;
                }

                const descInput = document.getElementById('post-descricao');
                
                const dadosPost = {
                    cpf: perfilAtual.cpf,
                    imagem: imagemPostBase64,
                    descricao: descInput ? descInput.value : ''
                };

                try {
                    const btnSubmit = formPost.querySelector('button');
                    const txtOriginal = btnSubmit.textContent;
                    btnSubmit.textContent = "Publicando...";
                    btnSubmit.disabled = true;

                    const response = await fetch(`${URL_BASE}/criar-post`, {
                        method: 'POST',
                        headers: headersPost, // Headers corrigidos
                        body: JSON.stringify(dadosPost)
                    });

                    if (response.ok) {
                        alert("Publicado com sucesso!");
                        modalPost.classList.remove('ativo');
                        carregarPerfilUsuario(); 
                    } else {
                        alert("Erro ao publicar.");
                    }
                    
                    btnSubmit.textContent = txtOriginal;
                    btnSubmit.disabled = false;

                } catch (erro) {
                    console.error(erro);
                    alert("Erro de conexão.");
                }
            });
        }
    }

    // Fechar ao clicar fora
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-container')) {
            e.target.classList.remove('ativo');
        }
    });
}

// ==============================================================
// 5. SIDEBAR E ALTO CONTRASTE
// ==============================================================
function inicializarSidebar() {
    const btnUsuario = document.querySelector('.profile-info') || document.querySelector('.usuario');
    const sidebar = document.getElementById('sidebar-perfil');
    const overlay = document.getElementById('sidebar-overlay');
    const btnFechar = document.getElementById('btn-fechar-sidebar');
    const btnSair = document.querySelector('.sidebar-sair a');

    const toggle = (st) => {
        if (!sidebar) return;
        if (st) { 
            sidebar.classList.add('ativo'); 
            if (overlay) overlay.classList.add('ativo'); 
        } else { 
            sidebar.classList.remove('ativo'); 
            if (overlay) overlay.classList.remove('ativo'); 
        }
    };

    if (btnUsuario) btnUsuario.addEventListener('click', (e) => { e.stopPropagation(); toggle(true); });
    if (btnFechar) btnFechar.addEventListener('click', () => toggle(false));
    if (overlay) overlay.addEventListener('click', () => toggle(false));
    if (btnSair) btnSair.addEventListener('click', () => localStorage.removeItem('usuarioLogado'));
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
    inicializarSidebar();
    inicializarModais();
    inicializarAltoContraste();
});