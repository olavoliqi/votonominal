#!/bin/bash

# Script para atualizar os signatários no site a partir do Google Sheets

SHEET_ID="1k7YbTEE9DR0nT5ChS27_C6phLrFCpzAIrrgnX14JtzQ"
GID="324537718"
CSV_URL="https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}"

echo "Baixando dados do Google Sheets..."
CSV_DATA=$(curl -sL "$CSV_URL")

# Verificar se retornou HTML (erro de permissão)
if echo "$CSV_DATA" | head -1 | grep -q "<!DOCTYPE\|<HTML>"; then
  echo "❌ Erro: planilha não está pública ou retornou HTML"
  echo "Configure a planilha como 'Qualquer pessoa com o link pode visualizar'"
  exit 1
fi

echo "Processando dados..."

# Extrair signatários por categoria (ignorando linha de cabeçalho)
CONSELHEIROS=$(echo "$CSV_DATA" | tail -n +2 | awk -F',' '$5 == "Conselheiro(a)" {print $2}')
CANDIDATOS=$(echo "$CSV_DATA" | tail -n +2 | awk -F',' '$5 == "Associado(a) candidato(a) ao conselho" {print $2}')
APOIADORES=$(echo "$CSV_DATA" | tail -n +2 | awk -F',' '$5 == "Associado(a) apoiador(a)" {print $2}')

# Contar
COUNT_C=$(echo "$CONSELHEIROS" | grep -c "." || echo "0")
COUNT_CAND=$(echo "$CANDIDATOS" | grep -c "." || echo "0")
COUNT_AP=$(echo "$APOIADORES" | grep -c "." || echo "0")

echo "Conselheiros: $COUNT_C"
echo "Candidatos: $COUNT_CAND"
echo "Apoiadores: $COUNT_AP"

# Gerar HTML para cada categoria
gen_html() {
  local count=$1
  local names=$2
  local empty_msg=$3
  
  if [ "$count" -eq 0 ]; then
    echo "                    <div class=\"signatario-item\" style=\"color: #999; text-align: center;\">$empty_msg</div>"
  else
    echo "$names" | while read -r name; do
      [ -z "$name" ] && continue
      echo "                    <div class=\"signatario-item\">✓ $name</div>"
    done
  fi
}

CONSELHEIROS_HTML=$(gen_html "$COUNT_C" "$CONSELHEIROS" "Nenhum conselheiro ainda.")
CANDIDATOS_HTML=$(gen_html "$COUNT_CAND" "$CANDIDATOS" "Nenhum candidato ainda.")
APOIADORES_HTML=$(gen_html "$COUNT_AP" "$APOIADORES" "Nenhum apoiador ainda.")

# Gerar seção completa
cat > /tmp/signatarios-section.html <<EOF
        <div class="signatarios-section">
            <div class="signatarios-categoria">
                <div class="signatarios-header">
                    <h2 class="signatarios-title">Conselheiros(as)</h2>
                    <span class="signatarios-count">$COUNT_C</span>
                </div>
                <div class="signatarios-list">
$CONSELHEIROS_HTML
                </div>
            </div>

            <div class="signatarios-categoria">
                <div class="signatarios-header">
                    <h2 class="signatarios-title">Associados(as) Candidatos(as) ao Conselho</h2>
                    <span class="signatarios-count">$COUNT_CAND</span>
                </div>
                <div class="signatarios-list">
$CANDIDATOS_HTML
                </div>
            </div>

            <div class="signatarios-categoria">
                <div class="signatarios-header">
                    <h2 class="signatarios-title">Associados(as) Apoiadores(as)</h2>
                    <span class="signatarios-count">$COUNT_AP</span>
                </div>
                <div class="signatarios-list">
$APOIADORES_HTML
                </div>
            </div>
        </div>
EOF

# Atualizar index.html
cd "$(dirname "$0")"
echo "Atualizando index.html..."

# Usar perl para substituir a seção (mais confiável que sed para regex multiline)
perl -i -0777 -pe 's{<div class="signatarios-section">.*?</div>\s*</div>\s*</div>\s*</div>\s*(<div class="footer">)}{`cat /tmp/signatarios-section.html`\n        $1}se' index.html

echo "✅ Site atualizado com sucesso!"
echo "Total: $((COUNT_C + COUNT_CAND + COUNT_AP)) signatários"
