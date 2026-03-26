# Gestor de Tickets com Webhooks

## Descrição
Projeto académico em Node.js com dois servidores independentes:
- **Servidor Principal (server-main)**: API REST para gestão de tickets (SQLite) e registo/disparo de webhooks
- **Servidor Secundário (server-webhook)**: recetor de webhooks + UI para visualizar eventos recebidos

## Tecnologias
- Node.js
- Express
- SQLite
- OpenAPI 3.0 (Swagger)
- Postman (testes manuais)

## Estrutura do Projeto
- `server-main/` — servidor principal (API REST + SQLite)
- `server-webhook/` — servidor recetor de webhooks (UI + validação HMAC)

---

## Pré-requisitos
- Node.js (LTS)
- npm
- Postman (recomendado para testes)
- Browser (para Swagger Editor)
- Link do ficheiro .csv https://www.kaggle.com/datasets/ahanwadi/itsm-data 

---

## Instalação e Execução

### 1) Instalar dependências
Servidor principal:
cd server-main
npm install

Servidor webhook:
cd ../server-webhook
npm install

### 2) Configurar variáveis de ambiente (.env)
PORT é obrigatório em ambos os servidores (não existe fallback no código).
Criar um ficheiro .env em cada servidor com a mesma WEBHOOK_SECRET.

server-main/.env:
PORT=3000
WEBHOOK_SECRET=minha-chave-super-secreta


server-webhook/.env:
PORT=4000
WEBHOOK_SECRET=minha-chave-super-secreta

### 3) Iniciar os servidores (terminais separados)
Servidor principal:
```bash
cd server-main
npm run dev
```

Servidor webhook:
```bash
cd server-webhook
npm start
```

### 4) Endereços úteis
- API principal: http://localhost:3000
- Healthcheck: http://localhost:3000/health
- Webhook receiver (UI): http://localhost:4000

### 5) Documentação da API (OpenAPI 3.0 / Swagger)
A especificação OpenAPI do servidor principal está em:
 - server-main/openapi.yaml

Como testar via Swagger (no browser)
- Iniciar o server-main
- Abrir: https://editor.swagger.io/
- Colar o conteúdo de server-main/openapi.yaml
- Usar Try it out para executar pedidos reais contra http://localhost:3000

Nota: Para permitir testes a partir do Swagger Editor (origem diferente), o servidor principal permite CORS de forma controlada para o domínio do Swagger Editor.

### 6) Listagem de Tickets (GET /api/tickets) — filtros suportados
A listagem suporta filtros por query parameters (documentados no Swagger com enum quando aplicável):
- status — Open, Closed, Work in progress
- priority — NA ou 1..5
- impact — NA ou 1..5
- urgency — 1..5 e 5 - Very Low
- ciCat — valores existentes na BD (enum no Swagger)
- archived — 0 (ativos) ou 1 (arquivados)
- paginação: limit, offset

Nota sobre ciSubcat:
O campo ciSubcat não é usado como filtro na listagem porque existem muitas subcategorias possíveis (dezenas), o que tornaria a documentação excessivamente extensa e pouco prática.
Ainda assim, ciSubcat continua a existir no modelo de dados e pode surgir nas respostas.

### 7) Inicialização automática da base de dados e dados iniciais (CSV)
No arranque do servidor principal:
- Se a base de dados (tickets.db) não existir, é recriada automaticamente.
- As tabelas necessárias são sempre criadas durante a inicialização.
- Se a base estiver vazia e existir server-main/data/tickets.csv, os tickets são importados automaticamente.
- Se o CSV não existir, a base é criada vazia e o sistema mantém-se funcional.

### 8) Testes completos (Postman) — pedidos prontos a copiar
Em todos os pedidos com body JSON: Header Content-Type: application/json

i) Healthcheck
GET http://localhost:3000/health

ii) Listar tickets (sem filtros)
GET http://localhost:3000/api/tickets

iii) Listar tickets com filtros e paginação
GET
http://localhost:3000/api/tickets?status=Open&priority=3&impact=2&urgency=5&ciCat=database&limit=10&offset=0

iv) Criar ticket
POST http://localhost:3000/api/tickets

Body:
{
  "ciName": "Servidor Web",
  "ciCat": "database",
  "ciSubcat": "mysql",
  "status": "Open",
  "impact": "2",
  "urgency": "5",
  "priority": "3"
}

v) Obter ticket por ID
GET http://localhost:3000/api/tickets/1

vi) Atualizar ticket
PUT http://localhost:3000/api/tickets/1

Body:
{
  "status": "Work in progress",
  "priority": "2"
}

vii) Arquivar ticket (soft delete)
DELETE http://localhost:3000/api/tickets/1

Nota: não remove fisicamente. Marca como arquivado.

8) Ver tickets arquivados
GET http://localhost:3000/api/tickets?archived=1

### 9) Estatísticas (para demonstrar agregações)

GET http://localhost:3000/api/tickets/stats/by-status

GET http://localhost:3000/api/tickets/stats/by-priority

GET http://localhost:3000/api/tickets/stats/by-ciCat

### 10) Webhooks (servidor principal → servidor webhook)
Eventos suportados:
- ticket.created
- ticket.updated
- ticket.archived

i) Registar webhook
POST http://localhost:3000/api/webhooks

Body:
{
  "url": "http://localhost:4000/webhooks",
  "event": "ticket.created"
}

ii) Disparar evento
Criar um ticket (POST /api/tickets) e confirmar que:
 - o server-webhook recebe e mostra o payload na UI (http://localhost:4000)

Repetir com ticket.updated e ticket.archived.

### 11) Segurança (HMAC com segredo partilhado)
Para garantir que webhooks provêm do servidor principal o servidor principal assina o body com HMAC-SHA256 e envia X-Webhook-Signature: sha256=<hex>

O servidor secundário recalcula com a mesma WEBHOOK_SECRET e rejeita assinaturas inválidas (401).

Os segredos ficam em .env e não devem ser versionados (estão excluídos via .gitignore).
