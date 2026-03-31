import fs from 'fs';
import csv from 'csv-parser';
import { insertTicket } from '../repositories/ticketsRepository.js';

function parseDateToIso(value) {
  // Formato no CSV: M/D/YYYY HH:mm
  if (!value) return null;

  const raw = String(value).trim();
  const split = raw.split(' ');
  if (split.length < 2) return null;

  const datePart = split[0];
  const timePart = split[1];

  const datePieces = datePart.split('/');
  if (datePieces.length !== 3) return null;

  const month = datePieces[0].padStart(2, '0');
  const day = datePieces[1].padStart(2, '0');
  const year = datePieces[2];

  return `${year}-${month}-${day}T${timePart}:00`;
}

export function importTicketsFromCsv(db, csvFilePath) {
  return new Promise((resolve, reject) => {
    let processed = 0;
    let inserted = 0;

    const stream = fs.createReadStream(csvFilePath).pipe(csv());

    stream.on('data', async (row) => {
      stream.pause();

      try {
        processed++;

        const ticket = {
          ciName: row.CI_Name || null,
          ciCat: row.CI_Cat || null,
          ciSubcat: row.CI_Subcat || null,

          status: row.Status || null,
          impact: row.Impact || null,
          urgency: row.Urgency || null,
          priority: row.Priority || null,

          openTime: parseDateToIso(row.Open_Time),
          resolvedTime: parseDateToIso(row.Resolved_Time),
          closeTime: parseDateToIso(row.Close_Time),
        };

        const changes = await insertTicket(db, ticket);
        if (changes === 1) inserted++;

        stream.resume();
      } catch (err) {
        stream.destroy(err);
      }
    });

    stream.on('end', () => resolve({ processed, inserted }));
    stream.on('error', (err) => reject(err));
  });
}

