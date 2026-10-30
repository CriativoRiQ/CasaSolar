# Casa Solar — Landing page (pronta para publicação)

## Estrutura
- `index.html` — landing page
- `politica-de-privacidade/index.html` — política de privacidade (LGPD) — **revisar com o jurídico**
- `404.html`, `robots.txt`, `sitemap.xml`, `site.webmanifest`, `.htaccess` (HTTPS, www→sem www, segurança, cache, compressão, página 404)
- `assets/css`, `assets/js`, `assets/fonts` (Poppins auto-hospedada), `assets/img` (WebP/AVIF, ícones, og-image 1200×630)

## Publicação (hospedagem Apache/LiteSpeed — ex.: SiteGround, onde o site atual está)
1. Faça backup do WordPress atual.
2. Envie todo o conteúdo desta pasta para a raiz do domínio (`public_html`), incluindo o `.htaccess` (arquivo oculto).
3. Garanta o certificado SSL ativo (Let's Encrypt no painel). O `.htaccess` força HTTPS.
4. Envie o `sitemap.xml` no Google Search Console.
5. **Arquivos reais do site atual:** logo Casa Solar, logo Grupo AWT, ícones dos 3 diferenciais, favicons, vídeo e capa do vídeo
   são carregados direto de `https://casasolarn.com.br/wp-content/uploads/...`. **Mantenha a pasta `wp-content/uploads/2024/`
   no servidor** ao trocar o WordPress por esta página (ou copie os arquivos para `assets/` e ajuste os caminhos).
   Se algum não carregar, a página mostra automaticamente a versão de reserva (logo em SVG e ícones próprios).
6. Copie o vídeo `wp-content/uploads/2024/10/Primeiro-Video-Prova-Social.mp4` para `assets/video/prova-social.mp4`
   e troque o `src` do `<video>` em `index.html` (hoje aponta para o arquivo do WordPress).
   Em hospedagem Nginx, converta as regras do `.htaccess`.

## Rastreamento (GTM `GTM-N5BCC326`, o mesmo do site atual)
O GTM só carrega após o visitante aceitar cookies (banner LGPD). O Consent Mode v2 é enviado ao dataLayer.
Configure no GTM:
- **GA4**: tag de configuração com o ID de medição (G-XXXX) — *pendente: ID não está no código atual*.
- **Meta Pixel**: tag base + evento `Lead` — *pendente: ID do pixel*.
- **Google Ads**: conversão no evento `generate_lead` — *pendente: ID/rótulo de conversão*.
- Respeite as variáveis de consentimento (analytics_storage / ad_storage).

Eventos enviados ao dataLayer (todos com utm_* / gclid / fbclid quando houver):
| Evento | Quando |
|---|---|
| `generate_lead` | formulário enviado (lead_type, lead_city, bill_range) |
| `form_start` / `form_error` | início / erro de validação |
| `whatsapp_click`, `phone_click`, `email_click`, `map_click`, `social_click`, `cta_click` | cliques (click_label) |
| `project_filter`, `faq_open`, `video_play` | interações |
| `consent_update` | escolha de cookies |

UTMs são guardadas na sessão e vão junto na mensagem do WhatsApp como `[ref: origem / mídia / campanha]`.

## Formulário
Valida nome, WhatsApp (com DDD), cidade, tipo de imóvel e consentimento LGPD; tem antispam (honeypot) e abre o WhatsApp
oficial (84) 99897-4353 com os dados preenchidos. Para gravar leads também num CRM/planilha, preencha
`LEAD_ENDPOINT` em `assets/js/main.js` (webhook que aceita POST JSON).

## Fotos e mapa
- Fotos da equipe (`assets/img/equipe/`) e dos projetos (`assets/img/projetos/`) foram recortadas das telas enviadas, sem nome e sem botão;
  os textos (nome, cidade, kWp, chamada) são HTML, com animação. Para mais nitidez, substitua pelos arquivos originais mantendo os nomes.
- Mapa: Google Maps incorporado (sem chave de API) abaixo de "Mais dúvidas", com botão "Como chegar".
