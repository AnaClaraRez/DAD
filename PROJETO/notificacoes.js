/**
 * notificacoes.js
 * Gerencia o sistema de alertas e conecta com o Node-RED via Ngrok
 */

// 1. CONFIGURAÇÃO
// Pega a URL do config.js ou usa localhost como fallback
const NOTIF_URL_BASE = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://localhost:1880';

// Headers obrigatórios para o Ngrok (O "Crachá VIP")
const headersNotif = {
    headers: new Headers({ 
        "ngrok-skip-browser-warning": "true",
        "Content-Type": "application/json"
    })
};

// 2. INJETAR HTML (Cria o menu no DOM)
function inicializarHTMLNotificacoes() {
    // Tenta encontrar o container do perfil (aceita ambos os padrões de HTML que você usou)
    const containerPerfil = document.querySelector('.user-profile') || document.querySelector('.perfil');
    
    if (!containerPerfil) return; 

    // Procura o ícone do sino
    const sino = containerPerfil.querySelector('.notification') || containerPerfil.querySelector('.notificacao');
    
    if (sino) {
        // Garante que o pai tenha posição relativa para o dropdown flutuar corretamente
        if (getComputedStyle(containerPerfil).position === 'static') {
            containerPerfil.style.position = 'relative';
        }
        
        // 1. Cria a bolinha (Badge)
        if (!document.getElementById('notif-badge')) {
            const badge = document.createElement('div');
            badge.className = 'notification-badge';
            badge.id = 'notif-badge';
            badge.textContent = '0';
            badge.style.display = 'none'; // Começa escondido
            
            // Insere logo após o sino ou dentro do container do sino
            if (sino.parentNode === containerPerfil) {
                // Se o sino está solto no container
                sino.insertAdjacentElement('afterend', badge);
                // Ajuste manual de posição via JS para garantir
                badge.style.position = 'absolute';
                badge.style.top = '0';
                badge.style.right = '0';
            } else {
                sino.appendChild(badge);
            }
        }
        
        // 2. Cria o Menu Dropdown (se não existir)
        if (!document.getElementById('notificacoes-container')) {
            const dropdown = document.createElement('div');
            dropdown.id = 'notificacoes-container';
            dropdown.className = 'painel-notificacoes'; // Classe para CSS
            
            // CSS Inline de segurança para garantir que flutue
            dropdown.style.display = 'none';
            
            dropdown.innerHTML = `
                <div style="padding:10px; background:#f4f4f4; border-bottom:1px solid #ddd; font-weight:bold; color:#333;">
                    Notificações
                </div>
                <div id="notif-list" style="max-height:300px; overflow-y:auto;">
                    <div style="padding:20px; text-align:center; color:#999;">Carregando...</div>
                </div>
            `;
            containerPerfil.appendChild(dropdown);
        }

        // 3. Evento de Clique no Sino
        sino.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const menu = document.getElementById('notificacoes-container');
            
            if (menu) {
                if (menu.style.display === 'none' || menu.style.display === '') {
                    menu.style.display = 'block'; // Mostrar
                    verificarNotificacoes(); // Atualizar ao abrir
                } else {
                    menu.style.display = 'none'; // Esconder
                }
            }
        };

        // 4. Fechar ao clicar fora
        document.addEventListener('click', (e) => {
            const menu = document.getElementById('notificacoes-container');
            // Se o clique não foi no menu nem no sino
            if (menu && menu.style.display === 'block') {
                if (!containerPerfil.contains(e.target)) {
                    menu.style.display = 'none';
                }
            }
        });
    }
}

// 3. BUSCAR DADOS (API)
async function verificarNotificacoes() {
    const cpfLogado = localStorage.getItem('usuarioLogado');
    if (!cpfLogado) return;

    try {
        // Adicionei headersNotif aqui
        const response = await fetch(`${NOTIF_URL_BASE}/notificacoes?cpf=${cpfLogado}&t=${Date.now()}`, headersNotif);
        
        if (response.ok) {
            const notificacoes = await response.json();
            renderizarListaNotificacoes(notificacoes);
            atualizarBadge(notificacoes);
        }
    } catch (error) {
        // console.error("Erro conexão notificação:", error);
    }
}

// 4. RENDERIZAR LISTA
function renderizarListaNotificacoes(lista) {
    const container = document.getElementById('notif-list');
    if (!container) return;

    container.innerHTML = '';

    if (!lista || lista.length === 0) {
        container.innerHTML = '<div style="padding:20px; text-align:center; color:#999;">Nenhuma notificação nova.</div>';
        return;
    }

    lista.forEach(notif => {
        // Define cor de fundo se não lida
        const bgStyle = notif.lida ? 'background:white;' : 'background:#f0f7ff;';
        const foto = notif.remetente_foto || 'https://placehold.co/40/2729af/ffffff?text=N';

        const item = document.createElement('div');
        item.style.cssText = `${bgStyle} padding:10px; border-bottom:1px solid #eee; cursor:pointer; display:flex; gap:10px; align-items:center;`;
        item.onclick = () => lerNotificacao(notif.id);

        item.innerHTML = `
            <img src="${foto}" style="width:35px; height:35px; border-radius:50%; object-fit:cover;">
            <div style="flex-grow:1;">
                <p style="margin:0; font-size:13px; color:#333;">
                    <strong>${notif.remetente_nome || 'Sistema'}</strong> ${notif.texto}
                </p>
                <span style="font-size:11px; color:#999;">${formatarTempoRelativo(notif.data)}</span>
            </div>
        `;
        container.appendChild(item);
    });
}

function atualizarBadge(lista) {
    const badge = document.getElementById('notif-badge');
    if (!badge) return;

    const naoLidas = lista ? lista.filter(n => !n.lida).length : 0;

    if (naoLidas > 0) {
        badge.textContent = naoLidas > 9 ? '9+' : naoLidas;
        badge.style.display = 'flex'; // Mostra
        
        // Estilo manual caso o CSS falhe
        badge.style.position = 'absolute';
        badge.style.top = '-5px';
        badge.style.right = '-5px';
        badge.style.backgroundColor = 'red';
        badge.style.color = 'white';
        badge.style.borderRadius = '50%';
        badge.style.padding = '2px 6px';
        badge.style.fontSize = '10px';
        badge.style.fontWeight = 'bold';
        badge.style.zIndex = '100';
    } else {
        badge.style.display = 'none'; // Esconde
    }
}

// 5. MARCAR COMO LIDA
async function lerNotificacao(id) {
    try {
        // Adicionei headersNotif e method POST
        await fetch(`${NOTIF_URL_BASE}/ler-notificacao`, {
            method: 'POST',
            headers: { 
                "ngrok-skip-browser-warning": "true",
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({ id: id })
        });
        verificarNotificacoes(); // Atualiza a lista
    } catch (e) { console.error(e); }
}

// 6. ENVIAR NOTIFICAÇÃO (Global)
window.enviarNotificacao = async function(destinatarioCpf, texto, tipo = 'sistema') {
    const cpfLogado = localStorage.getItem('usuarioLogado');
    if (!cpfLogado || !destinatarioCpf || destinatarioCpf === cpfLogado) return; 

    // Pega dados do remetente da interface
    let meuNome = 'Alguém';
    const elNome = document.getElementById('nome-usuario') || document.getElementById('greeting-name');
    if (elNome) meuNome = elNome.textContent.replace(/Olá,|!/g, '').trim();
    
    let minhaFoto = '';
    const elFoto = document.getElementById('foto-usuario');
    if (elFoto) minhaFoto = elFoto.src;

    const payload = {
        destinatario_cpf: destinatarioCpf,
        remetente_nome: meuNome,
        remetente_foto: minhaFoto,
        tipo: tipo,
        texto: texto
    };

    try {
        await fetch(`${NOTIF_URL_BASE}/nova-notificacao`, {
            method: 'POST',
            headers: { 
                "ngrok-skip-browser-warning": "true",
                "Content-Type": "application/json" 
            },
            body: JSON.stringify(payload)
        });
    } catch (e) { console.error("Erro ao enviar notif:", e); }
};

function formatarTempoRelativo(dataIso) {
    const diff = Date.now() - new Date(dataIso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'Agora';
    if (min < 60) return `${min}m`;
    const horas = Math.floor(min / 60);
    if (horas < 24) return `${horas}h`;
    return new Date(dataIso).toLocaleDateString('pt-BR');
}

// Inicializa
document.addEventListener('DOMContentLoaded', () => {
    inicializarHTMLNotificacoes();
    verificarNotificacoes();
    setInterval(verificarNotificacoes, 10000); // Atualiza a cada 10s
});