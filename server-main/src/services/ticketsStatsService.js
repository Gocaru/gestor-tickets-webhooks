import {
  getStatsByStatus,
  getStatsByPriority,
  getStatsByCiCat,
} from '../repositories/ticketsStatsRepository.js';

export const getStatsByStatusService = async () => {
  const rows = await getStatsByStatus();
  return rows;
};

export const getStatsByPriorityService = async () => {
  const rows = await getStatsByPriority();
  return rows;
};

export const getStatsByCiCatService = async () => {
  const rows = await getStatsByCiCat();
  return rows;
};
