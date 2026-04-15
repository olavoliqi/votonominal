#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

const SHEET_ID = '1k7YbTEE9DR0nT5ChS27_C6phLrFCpzAIrrgnX14JtzQ';
const GID = '324537718';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;
const INDEX_PATH = path.join(__dirname, 'index.html');

function fetchCSV(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseCSV(csv) {
  // Remove \r and split by \n
  const lines = csv.replace(/\r/g, '').trim().split('\n');
  
  const signatarios = {
    'Conselheiro(a)': [],
    'Associado(a) candidato(a) ao conselho': [],
    'Associado(a) apoiador(a)': []
  };
  
  // Skip header (line 0)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Simple CSV split (works because names don't have commas)
    const parts = line.split(',');
    
    if (parts.length >= 5) {
      const nome = parts[1].trim();
      const tipo = parts[4].trim();
      
      if (signatarios[tipo]) {
        signatarios[tipo].push(nome);
      }
    }
  }
  
  return signatarios;
}

function generateHTML(signatarios) {
  const conselheiros = signatarios['Conselheiro(a)'];
  const candidatos = signatarios['Associado(a) candidato(a) ao conselho'];
  const apoiadores = signatarios['Associado(a) apoiador(a)'];
  
  const conselheirosHTML = conselheiros.length > 0
    ? conselheiros.map(nome => `                    <div class="signatario-item">✓ ${nome}</div>`).join('\n')
    : '                    <div class="signatario-item" style="color: #999; text-align: center;">Nenhum conselheiro ainda.</div>';
  
  const candidatosHTML = candidatos.length > 0
    ? candidatos.map(nome => `                    <div class="signatario-item">✓ ${nome}</div>`).join('\n')
    : '                    <div class="signatario-item" style="color: #999; text-align: center;">Nenhum candidato ainda.</div>';
  
  const apoiadoresHTML = apoiadores.length > 0
    ? apoiadores.map(nome => `                    <div class="signatario-item">✓ ${nome}</div>`).join('\n')
    : '                    <div class="signatario-item" style="color: #999; text-align: center;">Nenhum apoiador ainda.</div>';
  
  return `            <div class="signatarios-categoria">
                <div class="signatarios-header">
                    <h2 class="signatarios-title">Conselheiros(as)</h2>
                    <span class="signatarios-count">${conselheiros.length}</span>
                </div>
                <div class="signatarios-list">
${conselheirosHTML}
                </div>
            </div>

            <div class="signatarios-categoria">
                <div class="signatarios-header">
                    <h2 class="signatarios-title">Associados(as) Candidatos(as) ao Conselho</h2>
                    <span class="signatarios-count">${candidatos.length}</span>
                </div>
                <div class="signatarios-list">
${candidatosHTML}
                </div>
            </div>

            <div class="signatarios-categoria">
                <div class="signatarios-header">
                    <h2 class="signatarios-title">Associados(as) Apoiadores(as)</h2>
                    <span class="signatarios-count">${apoiadores.length}</span>
                </div>
                <div class="signatarios-list">
${apoiadoresHTML}
                </div>
            </div>`;
}

async function updateHTML() {
  try {
    console.log('Baixando dados do Google Sheets...');
    const csv = await fetchCSV(CSV_URL);
    
    console.log('Processando signatários...');
    const signatarios = parseCSV(csv);
    
    console.log('Conselheiros:', signatarios['Conselheiro(a)']);
    console.log('Candidatos:', signatarios['Associado(a) candidato(a) ao conselho']);
    console.log('Apoiadores:', signatarios['Associado(a) apoiador(a)']);
    
    console.log('Atualizando HTML...');
    let html = fs.readFileSync(INDEX_PATH, 'utf8');
    
    const newContent = generateHTML(signatarios);
    
    // Substituir a seção de signatários
    const regex = /<div class="signatarios-section">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*(\s*<div class="footer">)/;
    html = html.replace(regex, `<div class="signatarios-section">\n${newContent}\n        </div>$1`);
    
    fs.writeFileSync(INDEX_PATH, html);
    
    const total = signatarios['Conselheiro(a)'].length + signatarios['Associado(a) candidato(a) ao conselho'].length + signatarios['Associado(a) apoiador(a)'].length;
    console.log('✅ HTML atualizado com sucesso!');
    console.log(`Total: ${total} signatários`);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

updateHTML();
