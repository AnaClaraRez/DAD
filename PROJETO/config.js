// Arquivo: config.js

// 1. ENDEREÇO EXTERNO (Mude este valor quando reiniciar o LocalTunnel)
// Coloque seu link público atual:
const EXTERNAL_BASE_URL = "https://vegetation-obj-flashers-broadway.trycloudflare.com/"; 


// 2. LÓGICA DE SELEÇÃO AUTOMÁTICA
let API_BASE_URL = EXTERNAL_BASE_URL; // Padrão é o link público

// Se o código estiver rodando no seu computador (localhost ou 127.0.0.1),
// forçamos o uso da porta local do Node-RED para evitar erros CORS.
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    API_BASE_URL = "http://localhost:1880";
}

// 3. Exporte a variável para uso em telainicial.js, login.js, etc.
export { API_BASE_URL };