/**
 * cadastro.js
 * Gerencia o registro de novos usuários com upload de foto
 */

// 1. CONFIGURAÇÃO
const URL_BASE = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://localhost:1880';
// Função auxiliar para converter arquivo em Base64
const converterParaBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
};

document.getElementById('formCadastro').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const statusMessage = document.getElementById('mensagem-status');
    statusMessage.textContent = 'Processando cadastro...';
    statusMessage.style.color = '#284E9E'; 
    
    // 1. Coleta os dados de texto
    const formData = new FormData(this);
    const data = {};
    for (let [key, value] of formData.entries()) {
        // Ignora o campo de arquivo no loop normal, vamos tratar ele separado
        if (key !== 'foto') {
            data[key] = value;
        }
    }

    // 2. Trata a Imagem (Se o usuário selecionou uma)
    const fileInput = document.getElementById('foto');
    if (fileInput.files.length > 0) {
        try {
            const arquivo = fileInput.files[0];
            // Limite de segurança: 2MB (para não travar o Node-RED)
            if (arquivo.size > 2 * 1024 * 1024) {
                alert("A imagem é muito grande! Escolha uma menor que 2MB.");
                statusMessage.textContent = '';
                return;
            }
            // Converte e adiciona ao JSON
            data.foto = await converterParaBase64(arquivo);
        } catch (e) {
            console.error("Erro ao processar imagem", e);
        }
    } else {
        // Se não escolheu foto, manda string vazia (o Node-RED põe a padrão)
        data.foto = "";
    }
    
    const url = `${URL_BASE}/cadastro100`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true' // <--- OBRIGATÓRIO PARA NGROK
            },
            body: JSON.stringify(data)
        });

        // Tenta ler o JSON com segurança
        let result = {};
        try {
            result = await response.json();
        } catch (e) {
            console.warn("Resposta não era JSON válido.");
        }

        if (response.status === 409) {
            statusMessage.textContent = '❌ Falha: ' + (result.message || "CPF já cadastrado.");
            statusMessage.style.color = 'red';
        }
        else if (response.status === 200) {
            // Salva o CPF para login automático imediato
            localStorage.setItem('usuarioLogado', data.cpf); 

            statusMessage.textContent = '✅ Cadastro realizado! Entrando...';
            statusMessage.style.color = 'green';
            
            if (result.redirectUrl) {
                setTimeout(() => {
                    window.open(result.redirectUrl, '_self');
                }, 1000);
            } else {
                // Fallback se não vier url de redirecionamento
                setTimeout(() => {
                    window.location.href = 'telainicial.html';
                }, 1000);
            }
        }
        else {
            statusMessage.textContent = '❌ Erro no cadastro. Código: ' + response.status;
            statusMessage.style.color = 'red';
        }

    } catch (error) {
        console.error('Erro de conexão:', error);
        statusMessage.textContent = '❌ Erro de conexão com o servidor.';
        statusMessage.style.color = 'red';
    }
});

// --- LÓGICA DE ALTO CONTRASTE ---

const toggleContraste = document.getElementById('toggle-alto-contraste');
const body = document.body;

// 1. Verifica memória ao carregar
if (localStorage.getItem('altoContraste') === 'ativado') {
    body.classList.add('daltonismo-mode');
}

// 2. Clique no botão
if (toggleContraste) {
    toggleContraste.addEventListener('click', function(event) {
        event.preventDefault(); 

        body.classList.toggle('daltonismo-mode');

        if (body.classList.contains('daltonismo-mode')) {
            localStorage.setItem('altoContraste', 'ativado');
        } else {
            localStorage.removeItem('altoContraste');
        }
    });
}