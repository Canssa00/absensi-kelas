const { google } = require('googleapis');

/**
 * Google Sheets Helper
 * Ambil credentials dari environment variable GOOGLE_CREDENTIALS (base64 JSON)
 * Ambil spreadsheet ID dari environment variable SPREADSHEET_ID
 */

let sheetsInstance = null;
let spreadsheetId = null;

async function getSheets() {
  if (sheetsInstance) return sheetsInstance;

  const creds = JSON.parse(
    Buffer.from(process.env.GOOGLE_CREDENTIALS, 'base64').toString('utf8')
  );
  spreadsheetId = process.env.SPREADSHEET_ID;

  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  sheetsInstance = google.sheets({ version: 'v4', auth });
  return sheetsInstance;
}

function getSpreadsheetId() {
  return spreadsheetId || process.env.SPREADSHEET_ID;
}

/**
 * Baca semua baris dari sheet, return array of objects
 */
async function readSheet(sheetName) {
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${sheetName}!A:Z`,
  });

  const values = res.data.values;
  if (!values || values.length === 0) return [];

  const header = values[0];
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    const obj = {};
    header.forEach((col, j) => {
      obj[col] = values[i][j] || '';
    });
    rows.push(obj);
  }
  return rows;
}

/**
 * Tambah satu baris ke sheet
 */
async function appendRow(sheetName, rowArray) {
  const sheets = await getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: `${sheetName}!A:Z`,
    valueInputOption: 'RAW',
    requestBody: { values: [rowArray] },
  });
}

/**
 * Overwrite seluruh sheet (header + rows)
 */
async function updateSheet(sheetName, header, rows) {
  const sheets = await getSheets();
  const sid = getSpreadsheetId();

  // Clear
  await sheets.spreadsheets.values.clear({
    spreadsheetId: sid,
    range: `${sheetName}!A:Z`,
  });

  // Write header + data
  const values = [header];
  rows.forEach((row) => {
    const arr = header.map((col) => row[col] || '');
    values.push(arr);
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: sid,
    range: `${sheetName}!A:Z`,
    valueInputOption: 'RAW',
    requestBody: { values },
  });
}

/**
 * Generate ID baru (max id + 1)
 */
function generateId(rows) {
  let max = 0;
  rows.forEach((r) => {
    const n = parseInt(r.id, 10);
    if (n > max) max = n;
  });
  return max + 1;
}

module.exports = { readSheet, appendRow, updateSheet, generateId };