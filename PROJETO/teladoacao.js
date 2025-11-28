/**
 * teladoacao.js
 * Funcionalidades: Ngrok, Accordion de Pagamento, Alto Contraste e Sidebar
 */

// 1. CONFIGURAÇÃO INICIAL
// Tenta pegar a URL do config.js, senão usa localhost
const URL_BASE = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://localhost:1880';
// Cabeçalhos obrigatórios para o Ngrok não bloquear o JSON
const headersNgrok = {
    "ngrok-skip-browser-warning": "true",
    "Content-Type": "application/json"
};

document.addEventListener('DOMContentLoaded', () => {
    // Endereços da API
    const ENDPOINT_ONGS = `${URL_BASE}/ongs`;
    const ENDPOINT_PERFIL = `${URL_BASE}/perfil`;
    const ENDPOINT_DOAR = `${URL_BASE}/doar`;

    // Elementos da Interface
    const btnConfirmar = document.getElementById('btn-confirmar-doacao');
    const inputValor = document.getElementById('input-valor-doacao');
    
    // Dados do Usuário (Header e Sidebar)
    const nomeHeader = document.getElementById('nome-usuario');
    const nomeSidebar = document.getElementById('sidebar-nome');
    const fotoHeader = document.getElementById('foto-usuario');
    const fotoSidebar = document.getElementById('sidebar-foto');

    // Dados da ONG (Resumo à esquerda)
    const nomeOngEl = document.querySelector('.nome-ong');
    const dataDoacaoEl = document.querySelector('.data-doacao');
    const enderecoOngEl = document.querySelector('.endereco-ong');
    const ruaOngEl = document.querySelector('.rua-endereco');
    const imgOngEl = document.querySelector('.ong-logo-pequena');

    // Variáveis de Estado
    let ongAtual = null;
    let cpfUsuarioLogado = localStorage.getItem('usuarioLogado');

    // ==============================================================
    // 1. CARREGAR DADOS DO USUÁRIO
    // ==============================================================
    async function carregarUsuario() {
        if (!cpfUsuarioLogado) return;

        try {
            const res = await fetch(`${ENDPOINT_PERFIL}?t=${Date.now()}`, { headers: headersNgrok });
            const perfis = await res.json();
            
            // Encontra o usuário na lista ou usa o objeto único
            const usuario = Array.isArray(perfis) ? perfis.find(u => u.cpf === cpfUsuarioLogado) : perfis;

            if (usuario) {
                const nome = usuario.nome.split(' ')[0];
                if(nomeHeader) nomeHeader.textContent = `Olá, ${nome}`;
                if(nomeSidebar) nomeSidebar.textContent = `Olá, ${nome}`;

                const foto = usuario.foto || 'imagens/usuario.png';
                if(fotoHeader) fotoHeader.src = foto;
                if(fotoSidebar) fotoSidebar.src = foto;
            }
        } catch (e) {
            console.error("Erro ao carregar usuário:", e);
        }
    }

    // ==============================================================
    // 2. CARREGAR DADOS DA ONG
    // ==============================================================
    async function carregarOng() {
        const params = new URLSearchParams(window.location.search);
        const idOng = params.get('id');

        try {
            const res = await fetch(ENDPOINT_ONGS, { headers: headersNgrok });
            const ongs = await res.json();

            // Pega a ONG pelo ID ou pega a primeira se não tiver ID
            ongAtual = idOng ? ongs.find(o => o.id == idOng) : ongs[0];

            if (ongAtual) {
                if(nomeOngEl) nomeOngEl.textContent = ongAtual.nome;
                if(imgOngEl) imgOngEl.src = ongAtual.logo_url || 'https://placehold.co/100';
                
                // Preenche data de hoje
                if(dataDoacaoEl) dataDoacaoEl.textContent = new Date().toLocaleDateString('pt-BR');

                // Preenche endereço se existir
                if (ongAtual.endereco) {
                    const local = ongAtual.localizacao_curta || 'Brasil';
                    if(enderecoOngEl) enderecoOngEl.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${local}`;
                    if(ruaOngEl) ruaOngEl.textContent = ongAtual.endereco.rua || 'Endereço não informado';
                }
            }
        } catch (e) {
            console.error("Erro ao carregar ONG:", e);
        }
    }

    // ==============================================================
    // 3. LÓGICA DO ACCORDION (FORMAS DE PAGAMENTO)
    // ==============================================================
    const htmlCampos = {
        "Cartão de Crédito": `
            <div class="campo"><label>Número do Cartão:</label><input type="text" placeholder="0000 0000 0000 0000"></div>
            <div class="dupla">
                <div><label>Validade:</label><input type="text" placeholder="MM/AA"></div>
                <div><label>CVV:</label><input type="text" placeholder="123"></div>
            </div>
            <div class="campo"><label>Nome no Cartão:</label><input type="text" placeholder="Como está no cartão"></div>
        `,
        "PayPal": `<div class="campo"><label>Email do PayPal:</label><input type="email" placeholder="email@exemplo.com"></div>`,
        "Boleto": `
            <div class="campo"><label>CPF:</label><input type="text" placeholder="000.000.000-00"></div>
            <div class="campo"><label>Endereço:</label><input type="text" placeholder="Rua, número..."></div>
        `,
        "Pix": `<div class="campo" style="text-align:center; padding:20px;"><i class="fa-brands fa-pix" style="font-size:40px; color:#32bcad;"></i><p>O código Pix será gerado após confirmar.</p></div>`
    };

    function configurarAccordion() {
        const radios = document.querySelectorAll("input[name='forma_pagamento']");
        
        radios.forEach(radio => {
            radio.addEventListener("change", () => {
                abrirAccordion(radio.value, radio.closest(".opcao-radio"));
            });
        });

        // Abre a opção que já estiver marcada (checked) ao carregar
        const selecionado = document.querySelector("input[name='forma_pagamento']:checked");
        if(selecionado) {
            abrirAccordion(selecionado.value, selecionado.closest(".opcao-radio"));
        }
    }

    function abrirAccordion(metodo, elementoPai) {
        // 1. Remove accordions antigos
        document.querySelectorAll(".accordion-pagamento").forEach(el => el.remove());

        // 2. Verifica se tem HTML para esse método
        if(htmlCampos[metodo]) {
            const div = document.createElement("div");
            div.className = "accordion-pagamento";
            div.innerHTML = htmlCampos[metodo];
            
            // 3. Insere logo após o label do rádio
            elementoPai.insertAdjacentElement("afterend", div);

            // 4. Animação suave
            setTimeout(() => {
                div.style.maxHeight = "500px";
                div.style.opacity = "1";
            }, 10);
        }
    }

    // ==============================================================
    // 4. REALIZAR A DOAÇÃO (POST)
    // ==============================================================
    async function realizarDoacao() {
        // Validações
        const valorTxt = inputValor.value.replace(",", ".");
        const valor = parseFloat(valorTxt);
        const radio = document.querySelector('input[name="forma_pagamento"]:checked');

        if (!radio) return alert("Selecione uma forma de pagamento.");
        if (isNaN(valor) || valor <= 0) return alert("Insira um valor válido (ex: 50.00).");

        // Dados para enviar ao Node-RED
        const payload = {
            cpf_usuario: cpfUsuarioLogado,
            ong_nome: ongAtual ? ongAtual.nome : "ONG",
            ong_logo: ongAtual ? ongAtual.logo_url : "",
            valor: valor,
            metodo: radio.value,
            data: new Date().toISOString().split('T')[0] // Data de hoje YYYY-MM-DD
        };

        try {
            // Feedback visual
            btnConfirmar.disabled = true;
            btnConfirmar.textContent = "Processando...";

            const res = await fetch(ENDPOINT_DOAR, {
                method: "POST",
                headers: headersNgrok,
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("✅ Doação realizada com sucesso!");
                window.location.href = "historicodoacao.html"; // Redireciona para histórico
            } else {
                alert("❌ Erro ao processar doação.");
            }

        } catch (erro) {
            console.error(erro);
            alert("Erro de conexão com o servidor.");
        }

        // Restaura botão
        btnConfirmar.disabled = false;
        btnConfirmar.textContent = "Fazer Doação";
    }

    // ==============================================================
    // 5. SIDEBAR E ACESSIBILIDADE
    // ==============================================================
    function inicializarSidebar() {
        const sidebar = document.getElementById('sidebar-perfil');
        const overlay = document.getElementById('sidebar-overlay');
        const btnMenu = document.querySelector('.profile-info'); // Clique na foto do header
        const btnClose = document.getElementById('btn-fechar-sidebar');
        const btnSair = document.querySelector('.sidebar-sair a');

        const toggle = (estado) => {
            if(sidebar) sidebar.classList.toggle('ativo', estado);
            if(overlay) overlay.classList.toggle('ativo', estado);
        };

        if(btnMenu) btnMenu.addEventListener('click', (e) => { e.stopPropagation(); toggle(true); });
        if(btnClose) btnClose.addEventListener('click', () => toggle(false));
        if(overlay) overlay.addEventListener('click', () => toggle(false));
        
        if(btnSair) btnSair.addEventListener('click', () => localStorage.removeItem('usuarioLogado'));
    }

    function inicializarAltoContraste() {
        const btn = document.getElementById('toggle-alto-contraste');
        const body = document.body;

        // Carrega preferência salva
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
    carregarUsuario();
    carregarOng();
    configurarAccordion();
    inicializarSidebar();
    inicializarAltoContraste();

    if(btnConfirmar) btnConfirmar.addEventListener('click', realizarDoacao);
});