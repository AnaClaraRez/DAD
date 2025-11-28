/**
 * login.js
 * Gerencia a autenticação e conexão com o Backend
 */

// 1. CONFIGURAÇÃO DA URL - FORÇADA PARA CLOUDFLARE
const URL_BASE = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://localhost:1880';
document.getElementById('formLogin').addEventListener('submit', async function(event) {
    event.preventDefault();

    const statusMessage = document.getElementById('mensagem-status-login');
    statusMessage.textContent = 'Verificando credenciais...';
    statusMessage.style.color = '#284E9E';

    const cpf = document.getElementById('cpf').value;
    const senha = document.getElementById('senha').value;

    const url = `${URL_BASE}/login`;

    console.log('🔍 Tentando conectar em:', url); // Debug

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cpf, senha })
        });

        if (!response.ok && response.status === 0) {
            throw new Error('CORS ou conexão falhou');
        }

        const result = await response.json().catch(() => ({}));

        if (response.status === 401) {
            statusMessage.textContent = `❌ ${result.message || 'CPF ou senha incorretos.'}`;
            statusMessage.style.color = 'red';
            return;
        }

        if (response.status === 200) {
            statusMessage.textContent = '✅ Login realizado! Entrando...';
            statusMessage.style.color = 'green';

            localStorage.setItem('usuarioLogado', cpf); 

            if (result.redirectUrl) {
                setTimeout(() => {
                    window.open(result.redirectUrl, '_self');
                }, 1000);
            }
            return;
        }

        statusMessage.textContent = `❌ Erro inesperado. Status: ${response.status}`;
        statusMessage.style.color = 'red';

    } catch (error) {
        console.error('❌ Erro ao conectar:', error);
        statusMessage.textContent = '❌ Erro de conexão. Verifique se o backend está rodando.';
        statusMessage.style.color = 'red';
    }
});

// --- LÓGICA DE ALTO CONTRASTE ---

const toggleContraste = document.getElementById('toggle-alto-contraste');
const body = document.body;

if (localStorage.getItem('altoContraste') === 'ativado') {
    body.classList.add('daltonismo-mode');
}

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


//## Depois de salvar:

//1. **Salve o arquivo `login.js`**
//2. Peça para sua amiga dar **Ctrl + Shift + R** (recarregar forçado)
//3. Abrir o **Console** (F12) e verificar se aparece:
//```
   // Tentando conectar em: https://vegetation-obj-flashers-broadway.trycloudflare.com/login