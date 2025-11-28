/**
 * minhaconta.js
 * Gerencia dados do perfil, upload de foto e acessibilidade
 */

// 1. CONFIGURAÇÃO E HEADERS
const URL_BASE = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://localhost:1880';
const headersNgrok = {
    "ngrok-skip-browser-warning": "true",
    "Content-Type": "application/json"
};

let fotoBase64 = null; // Variável para guardar a nova foto

// ==============================================================
// 2. CARREGAR DADOS DO USUÁRIO
// ==============================================================
async function carregarPerfilUsuario() {
    try {
        const cpfLogado = localStorage.getItem('usuarioLogado');
        if (!cpfLogado) {
            alert("Você precisa estar logado.");
            window.location.href = "index.html";
            return;
        }

        // Busca dados no servidor (com header do Ngrok)
        const response = await fetch(`${URL_BASE}/minha-conta?cpf=${cpfLogado}&t=${Date.now()}`, {
            headers: { "ngrok-skip-browser-warning": "true" }
        });
        
        if (!response.ok) throw new Error("Erro ao buscar dados");

        const dados = await response.json();
        
        preencherDadosPerfil(dados);
        atualizarInterfaceUsuario(dados);

    } catch (err) {
        console.error('Erro ao carregar perfil:', err);
    }
}

function preencherDadosPerfil(dados) {
    const nome = dados.nomeCompleto || dados.nome || 'Usuário';
    
    // Preenche campos do formulário se eles existirem na tela
    if (document.getElementById('nome-completo')) {
        document.getElementById('nome-completo').textContent = nome;
        document.getElementById('email').value = dados.email || '';
        document.getElementById('cpf').value = dados.cpf || '';
        document.getElementById('telefone').value = dados.telefone || '';
        document.getElementById('genero').value = dados.genero || '';
        document.getElementById('nascimento').value = dados.nascimento || '';
        document.getElementById('idade').value = dados.idade || '';

        if (dados.foto) {
            document.getElementById('foto-perfil-grande').src = dados.foto;
        }
        
        // Calcula idade automaticamente se tiver data vinda do banco
        if(dados.nascimento) calcularIdade(dados.nascimento);
    }
}

// ==============================================================
// 3. INTERFACE (HEADER E SIDEBAR)
// ==============================================================
function atualizarInterfaceUsuario(dados) {
    const nome = dados.nomeCompleto || dados.nome || 'Usuário';
    const primeiroNome = nome.split(' ')[0];
    const foto = dados.foto || 'imagens/usuario.png';

    // Atualiza Header
    const greeting = document.getElementById('greeting-name');
    const headerPic = document.querySelector('.profile-pic'); // Classe usada no header
    
    if(greeting) greeting.textContent = `Olá, ${primeiroNome}!`;
    if(headerPic) headerPic.src = foto;

    // Atualiza Sidebar
    const sideNome = document.getElementById('sidebar-nome');
    const sidePic = document.getElementById('sidebar-foto');
    
    if(sideNome) sideNome.textContent = `Olá, ${primeiroNome}`;
    if(sidePic) sidePic.src = foto;
}

// ==============================================================
// 4. EVENTOS DE FORMULÁRIO E CÁLCULOS
// ==============================================================

// Upload de Foto (Preview e Conversão Base64)
const inputFoto = document.getElementById('input-foto-upload');
if(inputFoto) {
    inputFoto.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                // Mostra na tela
                document.getElementById('foto-perfil-grande').src = event.target.result;
                // Salva na variável para enviar depois
                fotoBase64 = event.target.result; 
            };
            reader.readAsDataURL(file);
        }
    });
}

// Cálculo de Idade Automático ao mudar a data
const inputNasc = document.getElementById('nascimento');
if(inputNasc) {
    inputNasc.addEventListener('change', (e) => calcularIdade(e.target.value));
}

function calcularIdade(dataString) {
    if (!dataString) return;
    const hoje = new Date();
    const nasc = new Date(dataString);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    // Ajusta se ainda não fez aniversário este ano
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    
    const inputIdade = document.getElementById('idade');
    if(inputIdade) inputIdade.value = idade;
}

// Salvar Alterações (Botão Submit)
const form = document.querySelector('.form-dados');
if(form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btnSalvar = document.querySelector('.btn-salvar');
        const txtOriginal = btnSalvar.innerHTML;
        
        // Feedback visual de carregamento
        btnSalvar.disabled = true;
        btnSalvar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';

        const dadosAtualizados = {
            cpf: document.getElementById('cpf').value,
            telefone: document.getElementById('telefone').value,
            genero: document.getElementById('genero').value,
            nascimento: document.getElementById('nascimento').value,
            idade: document.getElementById('idade').value,
            foto: fotoBase64 // Envia a foto nova (ou null se não mudou)
        };
        
        try {
            const response = await fetch(`${URL_BASE}/update-minha-conta`, {
                method: 'POST',
                headers: headersNgrok,
                body: JSON.stringify(dadosAtualizados)
            });

            if (response.ok) {
                alert('Dados atualizados com sucesso!');
                carregarPerfilUsuario(); // Recarrega para atualizar tudo
            } else {
                alert('Erro ao salvar dados.');
            }
        } catch (erro) {
            console.error(erro);
            alert('Erro de conexão.');
        }
        
        // Restaura botão
        btnSalvar.disabled = false;
        btnSalvar.innerHTML = txtOriginal;
    });
}

// ==============================================================
// 5. SIDEBAR E ALTO CONTRASTE
// ==============================================================
function inicializarSidebar() {
    const btnMenu = document.querySelector('.profile-info');
    const sb = document.getElementById('sidebar-perfil');
    const ov = document.getElementById('sidebar-overlay');
    const btnClose = document.getElementById('btn-fechar-sidebar');
    const btnSair = document.querySelector('.sidebar-sair a');

    const toggle = (estado) => {
        if(sb) sb.classList.toggle('ativo', estado);
        if(ov) ov.classList.toggle('ativo', estado);
    };

    if(btnMenu) btnMenu.addEventListener('click', (e) => { e.stopPropagation(); toggle(true); });
    if(btnClose) btnClose.addEventListener('click', () => toggle(false));
    if(ov) ov.addEventListener('click', () => toggle(false));
    
    if(btnSair) btnSair.addEventListener('click', () => localStorage.removeItem('usuarioLogado'));
}

function inicializarAltoContraste() {
    const btn = document.getElementById('toggle-alto-contraste');
    const body = document.body;
    
    // Verifica memória ao carregar
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
// INICIALIZAÇÃO GERAL
// ==============================================================
document.addEventListener('DOMContentLoaded', () => {
    carregarPerfilUsuario();
    inicializarSidebar();
    inicializarAltoContraste();
});