const https = require('https');
const apiKey = 'ttbsyt091591558001';

const queries = [
  "카프카의 편지", "학문의 진보", "도리안 그레이의 초상", "베이컨 에세이", "헤아려 본 슬픔",
  "적도를 따라가며", "의무론", "신학대전", "인간과 상징", "장 폴 사르트르 말", "카프카 변신"
];

async function fetchISBN(query) {
  return new Promise((resolve) => {
    const url = `https://www.aladin.co.kr/ttb/api/ItemSearch.aspx?ttbkey=${apiKey}&Query=${encodeURIComponent(query)}&QueryType=Keyword&MaxResults=1&start=1&SearchTarget=Book&output=js&Version=20131101`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.item && json.item[0] ? json.item[0].isbn13 : 'NOT_FOUND');
        } catch {
          resolve('ERROR');
        }
      });
    }).on('error', () => resolve('ERROR'));
  });
}

async function main() {
  for (const q of queries) {
    const isbn = await fetchISBN(q);
    console.log(`${q}: ${isbn}`);
  }
}
main();
