#!/usr/bin/env python3

import urllib.request
import re
from collections import OrderedDict

SHEET_ID = '1k7YbTEE9DR0nT5ChS27_C6phLrFCpzAIrrgnX14JtzQ'
GID = '324537718'
CSV_URL = f'https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid={GID}'

print('Baixando dados do Google Sheets...')
with urllib.request.urlopen(CSV_URL) as response:
    csv_data = response.read().decode('utf-8')

# Check if HTML was returned (permission error)
if csv_data.strip().startswith('<!DOCTYPE') or csv_data.strip().startswith('<HTML>'):
    print('❌ Erro: planilha não está pública')
    print('Configure como "Qualquer pessoa com o link pode visualizar"')
    exit(1)

print('Processando signatários...')

# Usar OrderedDict para manter ordem e remover duplicatas automaticamente
signatarios = {
    'Conselheiro(a)': OrderedDict(),
    'Associado(a) candidato(a) ao conselho': OrderedDict(),
    'Associado(a) apoiador(a)': OrderedDict()
}

lines = csv_data.strip().split('\n')
for line in lines[1:]:  # Skip header
    parts = line.split(',')
    if len(parts) >= 5:
        nome = parts[1].strip()
        tipo = parts[4].strip()
        if tipo in signatarios:
            # Remove espaços extras e normaliza nome
            nome_normalizado = ' '.join(nome.split())
            # Sobrescreve se já existe (mantém o último/mais recente)
            signatarios[tipo][nome_normalizado] = True

# Converter OrderedDict de volta para listas
signatarios = {k: list(v.keys()) for k, v in signatarios.items()}

print(f"Conselheiros: {len(signatarios['Conselheiro(a)'])}")
print(f"Candidatos: {len(signatarios['Associado(a) candidato(a) ao conselho'])}")
print(f"Apoiadores: {len(signatarios['Associado(a) apoiador(a)'])}")

def gen_items_html(names, empty_msg):
    if not names:
        return f'                    <div class="signatario-item" style="color: #999; text-align: center;">{empty_msg}</div>'
    return '\n'.join(f'                    <div class="signatario-item">✓ {nome}</div>' for nome in names)

conselheiros_html = gen_items_html(signatarios['Conselheiro(a)'], 'Nenhum conselheiro ainda.')
candidatos_html = gen_items_html(signatarios['Associado(a) candidato(a) ao conselho'], 'Nenhum candidato ainda.')
apoiadores_html = gen_items_html(signatarios['Associado(a) apoiador(a)'], 'Nenhum apoiador ainda.')

new_section = f'''        <div class="signatarios-section">
            <div class="signatarios-categoria">
                <div class="signatarios-header">
                    <h2 class="signatarios-title">Conselheiros(as)</h2>
                    <span class="signatarios-count">{len(signatarios['Conselheiro(a)'])}</span>
                </div>
                <div class="signatarios-list">
{conselheiros_html}
                </div>
            </div>

            <div class="signatarios-categoria">
                <div class="signatarios-header">
                    <h2 class="signatarios-title">Associados(as) Candidatos(as) ao Conselho</h2>
                    <span class="signatarios-count">{len(signatarios['Associado(a) candidato(a) ao conselho'])}</span>
                </div>
                <div class="signatarios-list">
{candidatos_html}
                </div>
            </div>

            <div class="signatarios-categoria">
                <div class="signatarios-header">
                    <h2 class="signatarios-title">Associados(as) Apoiadores(as)</h2>
                    <span class="signatarios-count">{len(signatarios['Associado(a) apoiador(a)'])}</span>
                </div>
                <div class="signatarios-list">
{apoiadores_html}
                </div>
            </div>
        </div>'''

print('Atualizando index.html...')
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace signatarios section
pattern = r'<div class="signatarios-section">.*?</div>\s*</div>\s*</div>\s*</div>\s*(<div class="footer">)'
html = re.sub(pattern, new_section + '\n\n        \\1', html, flags=re.DOTALL)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

total = sum(len(v) for v in signatarios.values())
print(f'✅ HTML atualizado com sucesso!')
print(f'Total: {total} signatários')
