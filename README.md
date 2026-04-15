# Site Voto Nominal ECP

Site para coleta de assinaturas a favor do voto nominal e aberto no Conselho Deliberativo do Esporte Clube Pinheiros.

## 🌐 URLs

- **Produção:** https://www.votonominal.com.br
- **GitHub Pages:** https://olavoliqi.github.io/votonominal/
- **Google Forms:** https://forms.gle/sDb33iFNRE1yfwySA
- **Planilha de Respostas:** https://docs.google.com/spreadsheets/d/1k7YbTEE9DR0nT5ChS27_C6phLrFCpzAIrrgnX14JtzQ/edit

## 📊 Como Funciona

1. Usuários preenchem o formulário Google Forms
2. Respostas são salvas automaticamente no Google Sheets
3. Script Python (`update-signatarios.py`) lê a planilha e atualiza `index.html`
4. Mudanças são commitadas e enviadas para o GitHub
5. GitHub Pages faz deploy automático

## 🔄 Atualização Automática

O sistema roda **automaticamente a cada hora** via cron job do OpenClaw.

### Atualizar manualmente:

```bash
cd /root/.openclaw/workspace/votonominal-site
python3 update-signatarios.py
git add index.html
git commit -m "Atualizar signatários"
git push origin main
```

## 🛠️ Arquivos

- `index.html` - Página principal do site
- `update-signatarios.py` - Script de atualização (Python)
- `update-signatarios.js` - Script de atualização (Node.js, alternativo)
- `update-signatarios.sh` - Script de atualização (Bash, alternativo)
- `README.md` - Este arquivo

## 📝 Categorias

1. **Conselheiros(as)** - Membros do Conselho Deliberativo
2. **Associados(as) Candidatos(as) ao Conselho** - Candidatos às eleições
3. **Associados(as) Apoiadores(as)** - Demais associados que apoiam a causa

## 🔐 Permissões

- Planilha Google Sheets configurada como **"Qualquer pessoa com o link pode visualizar"**
- Repositório GitHub: público
- GitHub Pages: ativo na branch `main`

## 🚀 Deploy

O deploy é automático via GitHub Pages. Qualquer push para `main` atualiza o site em ~1 minuto.

## 📞 Contato

Olavo Meyer - olavomeyer@gmail.com
