export const getHealth = async (req, res) => {
  try {
    const healthInfo = {
      estado: 'online',
      porta: process.env.PORT || 3000,
      timestamp: new Date().toISOString(),
      servico: 'Servidor Principal - Gestor de Tickets',
      mensagem: 'O servidor está a funcionar corretamente',
    };

    res.status(200).json(healthInfo);
  } catch (error) {
    console.error("Healthcheck error:", error);

    res.status(500).json({
      error: "Internal Server Error",
    });
  }
};