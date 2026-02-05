// src/controllers/healthController.js
//
// Controller responsável pelo healthcheck do servidor.
// Este endpoint permite verificar rapidamente se:
// - o servidor está a responder
// - a aplicação está funcional
// - o ambiente está corretamente configurado
//

/**
 * Endpoint de healthcheck.
 *
 * Responde com informação básica sobre o estado do servidor.
 * Usado para:
 * - testes rápidos (browser, Postman, curl)
 * - monitorização
 * - validação automática em ambientes de desenvolvimento
 */
export const getHealth = async (req, res) => {
  try {
    // Informação de estado do servidor
    const healthInfo = {
      estado: 'online', // Estado lógico do serviço
      porta: process.env.PORT, // Porta onde o servidor está a correr
      timestamp: new Date().toISOString(), // Momento da resposta
      servico: 'Servidor Principal - Gestor de Tickets', // Nome do serviço
      mensagem: 'O servidor está a funcionar corretamente', // Mensagem informativa
    };

    // Resposta HTTP 200 (OK) com informação de saúde
    res.status(200).json(healthInfo);
  } catch (error) {
    // Em caso de erro inesperado (raro neste endpoint)
    console.error('[HEALTH] Erro no healthcheck:', error);

    // Resposta HTTP 500 (Internal Server Error)
    res.status(500).json({
      error: 'Internal Server Error',
    });
  }
};
