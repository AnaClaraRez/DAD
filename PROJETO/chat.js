/**
 * chat.js
 * Gerencia o sistema de mensagens e lista de contatos
 */

// ==============================================================
// 1. CONFIGURAÇÃO
// ==============================================================
const URL_BASE = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://localhost:1880';
// Headers para GET (Ngrok)
const headersGet = {
    headers: new Headers({ "ngrok-skip-browser-warning": "true" })
};

// Headers para POST (JSON + Ngrok)
const headersPost = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true"
};

let usuarioLogado = localStorage.getItem('usuarioLogado');
let destinatarioAtual = null;
let listaMensagens = [];

// ==============================================================
// 2. INICIALIZAÇÃO
// ==============================================================
document.addEventListener('DOMContentLoaded', async () => {
    if (!usuarioLogado) {
        alert("Faça login para acessar o chat.");
        window.location.href = 'index.html';
        return;
    }

    carregarPerfilUsuario(); // Carrega foto do topo/sidebar
    inicializarSidebar();
    inicializarAltoContraste();

    // Carrega mensagens iniciais
    await atualizarMensagens();

    // Verifica se veio redirecionado (ex: botão "Mensagem" no perfil da ONG)
    const params = new URLSearchParams(window.location.search);
    const destId = params.get('destinatario');
    const destNome = params.get('nome'); 

    if (destId) {
        // Força a abertura da conversa, mesmo sem mensagens anteriores
        selecionarContato(destId, destNome || 'Novo Contato', 'https://placehold.co/50?text=U');
    }

    // Polling: Atualiza a cada 5 segundos
    setInterval(atualizarMensagens, 5000);

    // Eventos de envio
    document.getElementById('btn-send').addEventListener('click', enviarMensagem);
    document.getElementById('msg-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') enviarMensagem();
    });
});

// ==============================================================
// 3. CARREGAR MENSAGENS
// ==============================================================
async function atualizarMensagens() {
    try {
        const res = await fetch(`${URL_BASE}/mensagens?t=${Date.now()}`, headersGet);
        const todas = await res.json();
        
        // Filtra apenas mensagens que envolvem o usuário logado
        listaMensagens = todas.filter(m => m.remetente === usuarioLogado || m.destinatario === usuarioLogado);
        
        renderizarListaContatos();
        
        // Se estiver com um chat aberto, atualiza ele também
        if (destinatarioAtual) {
            renderizarConversa(destinatarioAtual);
        }
    } catch (e) { 
        console.error("Erro ao buscar mensagens", e); 
    }
}

// ==============================================================
// 4. RENDERIZAR LISTA DE CONTATOS (ESQUERDA)
// ==============================================================
async function renderizarListaContatos() {
    const contatosMap = new Map();

    // Agrupa mensagens por contato
    listaMensagens.forEach(msg => {
        const outroId = msg.remetente === usuarioLogado ? msg.destinatario : msg.remetente;
        // Armazena a última mensagem
        contatosMap.set(outroId, msg);
    });

    const container = document.getElementById('contact-list');
    
    // Se veio um destinatário da URL e ele ainda não tem msg, adiciona manualmente
    const params = new URLSearchParams(window.location.search);
    const urlDest = params.get('destinatario');
    if (urlDest && !contatosMap.has(urlDest)) {
        contatosMap.set(urlDest, { 
            texto: "Inicie a conversa...", 
            data: new Date().toISOString(),
            fake: true 
        });
    }

    container.innerHTML = '';

    // Renderiza cada contato
    for (let [id, msg] of contatosMap) {
        const info = await buscarInfoContato(id);
        const activeClass = id === destinatarioAtual ? 'active' : '';
        
        const html = `
            <div class="contact-item ${activeClass}" onclick="selecionarContato('${id}', '${info.nome}', '${info.foto}')">
                <img src="${info.foto}" class="contact-avatar" onerror="this.src='https://placehold.co/50?text=U'">
                <div class="contact-info">
                    <h4>${info.nome}</h4>
                    <p>${msg.texto.substring(0, 30)}${msg.texto.length > 30 ? '...' : ''}</p>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    }
}

// Identifica quem é o contato (ONG ou Usuário) para pegar Nome e Foto
async function buscarInfoContato(id) {
    // 1. Tenta na lista de ONGs
    try {
        const resOngs = await fetch(`${URL_BASE}/ongs`, headersGet);
        const ongs = await resOngs.json();
        const ong = ongs.find(o => String(o.id) === String(id));
        if (ong) return { nome: ong.nome, foto: ong.logo_url };
    } catch (e) {}

    // 2. Tenta na lista de Perfis
    try {
        const resUsers = await fetch(`${URL_BASE}/perfil`, headersGet);
        const users = await resUsers.json();
        const user = Array.isArray(users) ? users.find(u => u.cpf === id) : null;
        if (user) return { nome: user.nome, foto: user.foto || 'imagens/usuario.png' };
    } catch (e) {}

    // 3. Fallback (Usa dados da URL se disponível)
    const params = new URLSearchParams(window.location.search);
    if (id === params.get('destinatario')) {
        return { 
            nome: params.get('nome') || 'Novo Contato', 
            foto: 'imagens/usuario.png' 
        };
    }

    return { nome: 'Usuário', foto: 'imagens/usuario.png' };
}

// ==============================================================
// 5. CONVERSA (DIREITA)
// ==============================================================
function selecionarContato(id, nome, foto) {
    destinatarioAtual = id;
    
    // Mostra área de chat e limpa mensagens antigas
    document.getElementById('chat-header').style.display = 'flex';
    document.getElementById('chat-input-area').style.display = 'flex';
    document.getElementById('chat-name').textContent = nome;
    document.getElementById('chat-avatar').src = foto;
    
    renderizarConversa(id);
    
    // Atualiza visual da lista
    document.querySelectorAll('.contact-item').forEach(el => el.classList.remove('active'));
}

function renderizarConversa(id) {
    const box = document.getElementById('messages-box');
    
    // Filtra mensagens deste chat
    const msgsConversa = listaMensagens.filter(m => 
        (m.remetente === usuarioLogado && m.destinatario === id) ||
        (m.remetente === id && m.destinatario === usuarioLogado)
    );

    // Ordena por data
    msgsConversa.sort((a, b) => new Date(a.data) - new Date(b.data));

    box.innerHTML = '';
    
    if(msgsConversa.length === 0) {
        box.innerHTML = '<div style="text-align:center; color:#999; margin-top:20px;">Nenhuma mensagem. Diga Olá! 👋</div>';
    }

    msgsConversa.forEach(msg => {
        const tipo = msg.remetente === usuarioLogado ? 'msg-sent' : 'msg-received';
        const dataObj = new Date(msg.data);
        const hora = isNaN(dataObj.getTime()) ? '' : dataObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        const html = `
            <div class="message ${tipo}">
                ${msg.texto}
                <div class="msg-time">${hora}</div>
            </div>
        `;
        box.insertAdjacentHTML('beforeend', html);
    });

    // Rola para o fim
    box.scrollTop = box.scrollHeight;
}

// ==============================================================
// 6. ENVIAR MENSAGEM
// ==============================================================
async function enviarMensagem() {
    const input = document.getElementById('msg-input');
    const texto = input.value.trim();
    
    if (!texto || !destinatarioAtual) return;

    // Objeto da mensagem
    const novaMsg = {
        remetente: usuarioLogado,
        destinatario: destinatarioAtual,
        texto: texto,
        data: new Date().toISOString()
    };

    // Atualiza visualmente (Feedback imediato)
    listaMensagens.push(novaMsg);
    renderizarConversa(destinatarioAtual);
    input.value = '';

    try {
        // 1. Envia para o endpoint de Chat
        await fetch(`${URL_BASE}/enviar-mensagem`, {
            method: 'POST',
            headers: headersPost,
            body: JSON.stringify(novaMsg)
        });

        // 2. Gera Notificação para o Destinatário
        await enviarNotificacaoMensagem(destinatarioAtual, texto);

    } catch (e) {
        console.error("Erro ao enviar:", e);
    }
}

async function enviarNotificacaoMensagem(destinatario, textoMsg) {
    // Pega meu nome e foto para a notificação
    let meuNome = 'Alguém';
    const elNome = document.getElementById('nome-usuario') || document.getElementById('sidebar-nome');
    if (elNome) meuNome = elNome.textContent.replace(/Olá,|!/g, '').trim();

    let minhaFoto = '';
    const elFoto = document.getElementById('foto-usuario');
    if (elFoto) minhaFoto = elFoto.src;

    const notificacao = {
        destinatario_cpf: destinatario,
        remetente_nome: meuNome,
        remetente_foto: minhaFoto,
        tipo: 'mensagem',
        texto: `enviou: "${textoMsg.substring(0, 20)}${textoMsg.length > 20 ? '...' : ''}"`
    };

    // Envia para endpoint de notificação
    await fetch(`${URL_BASE}/nova-notificacao`, {
        method: 'POST',
        headers: headersPost,
        body: JSON.stringify(notificacao)
    });
}

// ==============================================================
// 7. PERFIL, SIDEBAR E ALTO CONTRASTE
// ==============================================================
async function carregarPerfilUsuario() {
    try {
        const res = await fetch(`${URL_BASE}/perfil?t=${Date.now()}`, headersGet);
        const dados = await res.json();
        const perfil = Array.isArray(dados) ? dados.find(u => u.cpf === usuarioLogado) : dados;
        
        if(perfil) {
            const nome = perfil.nome.split(' ')[0];
            const foto = perfil.foto || 'imagens/usuario.png';
            
            // Header
            document.getElementById('nome-usuario').textContent = `Olá, ${nome}!`;
            document.getElementById('foto-usuario').src = foto;
            
            // Sidebar
            document.getElementById('sidebar-nome').textContent = `Olá, ${nome}`;
            document.getElementById('sidebar-foto').src = foto;
        }
    } catch(e) { console.error(e); }
}

function inicializarSidebar() {
    const btnMenu = document.querySelector('.usuario');
    const sidebar = document.getElementById('sidebar-perfil');
    const overlay = document.getElementById('sidebar-overlay');
    const btnClose = document.getElementById('btn-fechar-sidebar');
    const btnSair = document.querySelector('.sidebar-sair a');

    const toggle = (s) => {
        if(sidebar && overlay) {
            if(s) { sidebar.classList.add('ativo'); overlay.classList.add('ativo'); }
            else { sidebar.classList.remove('ativo'); overlay.classList.remove('ativo'); }
        }
    };

    if(btnMenu) btnMenu.addEventListener('click', (e) => { e.stopPropagation(); toggle(true); });
    if(btnClose) btnClose.addEventListener('click', () => toggle(false));
    if(overlay) overlay.addEventListener('click', () => toggle(false));
    if(btnSair) btnSair.addEventListener('click', () => localStorage.removeItem('usuarioLogado'));
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