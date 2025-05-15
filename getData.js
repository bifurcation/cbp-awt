// Reverse engineered from https://apply.joinsherpa.com/map

const AWT_API = "https://awt.cbp.gov/api/waitTime";
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_YEAR = 365 * MS_PER_DAY;
const MOVING_AVERAGE_DAYS = 30;
const MOVING_AVERAGE_MS = MOVING_AVERAGE_DAYS * MS_PER_DAY;

function uniq(arr) {
  const uniq = arr.filter((val, i, arr) => arr.indexOf(val) === i);
  uniq.sort();
  return uniq;
}

function toISO(date) {
  const yyyy = date.getFullYear().toString().padStart(4, 0);
  const mm = (date.getMonth() + 1).toString().padStart(2, 0);
  const dd = date.getDate().toString().padStart(2, 0);
  return `${yyyy}-${mm}-${dd}`;
}

async function loadAirport(code, fromDate, toDate) {
  const fromStr = toISO(fromDate);
  const toStr = toISO(toDate);

  const requestBody = `{
    "Id":"${code}",
    "FromDate":"${fromStr}",
    "ToDate":"${toStr}"
  }`;

  const response = await fetch(AWT_API, {
    method: "POST",
    body: requestBody,
    headers: { "Content-Type": "application/json" },
  });

  const responseBody = await response.json();
  const rows = responseBody.Items;

  // Compute totals per day
  let totalNonUS = {};
  for (let row of rows) {
    totalNonUS[row["FlightDate"]] = totalNonUS[row["FlightDate"]] || 0;
    totalNonUS[row["FlightDate"]] += row["NonUsaPassengerCount"];
  }

  return totalNonUS;
}

function movingAverageYoY(dates, totalNonUS) {
  // Compute moving average
  let movingAverage = {};
  for (let date of dates) {
    let range = dates.filter(d => {
      let diff = (new Date(date) - new Date(d));
      return diff >= 0 && diff < MOVING_AVERAGE_MS;
    });
    if (range.length < MOVING_AVERAGE_DAYS) {
      // console.error("Insufficient moving average data", date, range.length);
      continue;
    }

    movingAverage[date] = range.map(d => totalNonUS[d]).reduce((a, b) => a + b);
    movingAverage[date] /= range.length;
  }

  // Compute year-on-year change
  let yearOnYear = {};
  for (let date of dates) {
    let yearAgoCandidates = dates.filter(d => {
      let dateDiffMS = (new Date(date) - new Date(d));
      let yearDiffMS = dateDiffMS - MS_PER_YEAR;
      return Math.abs(yearDiffMS) < MS_PER_DAY;
    });
    if (yearAgoCandidates.length == 0) {
      // console.error("no year ago", date);
      continue;
    }

    let yearAgo = yearAgoCandidates[0];
    if (!movingAverage[yearAgo]) {
      // console.error("no year ago data", date);
      continue;
    }

    yearOnYear[date] = movingAverage[date] / movingAverage[yearAgo] - 1;
  }

  return yearOnYear;
}

const airports = [
  // Original small set
  /*
  "JFK",
  "MIA",
  "EWR",
  "LAX",
  "ORD",
  "HNL",
  */

  // All available airports
  "ATL",
  "AUS",
  "BNA",
  "BOS",
  "BWI",
  "CLT",
  "CVG",
  "DEN",
  "DFW",
  "DTW",
  "EWR",
  "FAT",
  "FLL",
  "GUM",
  "HNL",
  "IAD",
  "IAH",
  "JFK",
  "LAS",
  "LAX",
  "MCO",
  "MDW",
  "MIA",
  "MSP",
  "OAK",
  "ONT",
  "ORD",
  "PBI",
  "PDX",
  "PHL",
  "PHX",
  "PVD",
  "RDU",
  "SAN",
  "SAT",
  "SEA",
  "SFB",
  "SFO",
  "SJC",
  "SJU",
  "SLC",
  "SMF",
  "SNA",
  "SPN",
  "STL",
  "TPA",
];

const end = new Date();
const start = new Date(end - (2 * 365 + MOVING_AVERAGE_DAYS) * MS_PER_DAY);

const datasets = {};
for (let code of airports) {
  console.error(`${code} ...`);
  datasets[code] = await loadAirport(code, start, end);
}

const dates = uniq(Object.keys(datasets).map(code => Object.keys(datasets[code])).flat());

// Compute total series
const totalDataset = {};
for (let date of dates) {
  for (let code in datasets) {
    if (!datasets[code][date]) {
      continue;
    }

    totalDataset[date] = totalDataset[date] || 0;
    totalDataset[date] += datasets[code][date];
  }
}

datasets["total"] = totalDataset;

// Compute YoY change in moving average
const series = {};
for (let code in datasets) {
  series[code] = movingAverageYoY(dates, datasets[code]);
}

// Render data in a format that the plotting library likes
const seriesDates = uniq(Object.keys(series).map(code => Object.keys(series[code])).flat());
const data = seriesDates.map(date => {
  let nonUS = {};
  for (let code in series) {
    nonUS[code] = series[code][date];
  }

  return { date: toISO(new Date(date)), nonUS };
});

console.log(`const data = ${JSON.stringify(data, null, 2)};`);
