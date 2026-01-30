export const getHealth = (req, res) => {
  const healthInfo = {
    estado: 'online',
    porta: process.env.PORT || 3000,
    timestamp: new Date().toISOString(),
    servico: 'Servidor Principal - Gestor de Tickets',
    mensagem: 'O servidor está a funcionar corretamente',
  };
  res.status(200).json(healthInfo);
};


//falta os erros 