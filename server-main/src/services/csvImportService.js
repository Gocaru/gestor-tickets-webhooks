import fs from 'fs';
import csv from 'csv-parser';
import { insertTicket } from '../repositories/ticketsRepository.js';

function parseInteger(value) {
  if (value === undefined || value === null) return null;
  const n = parseInt(String(value).trim(), 10);
  return Number.isNaN(n) ? null : n;
}

function parseHandleTimeToNumber(value) {
  if (!value) return null;

  // Ex.: "4,35,47,86,389" -> 4.354786389
  const raw = String(value).replace(/"/g, '').trim();
  const parts = raw.split(',');

  if (parts.length === 1) {
    const n = Number(parts[0]);
    return Number.isNaN(n) ? null : n;
  }

  const intPart = parts[0];
  const decPart = parts.slice(1).join('');
  const n = Number(intPart + '.' + decPart);

  return Number.isNaN(n) ? null : n;
}

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

export function importTicketsFromCsv(csvFilePath) {
  return new Promise((resolve, reject) => {
    let processed = 0;
    let inserted = 0;

    const stream = fs.createReadStream(csvFilePath).pipe(csv());

    stream.on('data', async (row) => {
      stream.pause();

      try {
        processed++;

        const ticket = {
          incidentId: row.Incident_ID,

          ciName: row.CI_Name || null,
          ciCat: row.CI_Cat || null,
          ciSubcat: row.CI_Subcat || null,
          wbs: row.WBS || null,
          category: row.Category || null,

          status: row.Status || null,
          impact: row.Impact || null,
          urgency: row.Urgency || null,
          priority: row.Priority || null,

          numberCnt: parseInteger(row.number_cnt),
          kbNumber: row.KB_number || null,
          alertStatus: row.Alert_Status || null,
          noOfReassignments: parseInteger(row.No_of_Reassignments),

          openTime: parseDateToIso(row.Open_Time),
          reopenTime: parseDateToIso(row.Reopen_Time),
          resolvedTime: parseDateToIso(row.Resolved_Time),
          closeTime: parseDateToIso(row.Close_Time),

          handleTimeHrs: parseHandleTimeToNumber(row.Handle_Time_hrs),

          closureCode: row.Closure_Code || null,

          noOfRelatedInteractions: parseInteger(row.No_of_Related_Interactions),
          relatedInteraction: row.Related_Interaction || null,
          noOfRelatedIncidents: parseInteger(row.No_of_Related_Incidents),
          noOfRelatedChanges: parseInteger(row.No_of_Related_Changes),
          relatedChange: row.Related_Change || null
        };

        const changes = await insertTicket(ticket);
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