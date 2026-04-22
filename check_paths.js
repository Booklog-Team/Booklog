import path from 'node:path';
console.log('import.meta.url:', import.meta.url);
console.log('import.meta.dirname:', import.meta.dirname);
console.log('Resolved root:', path.resolve(import.meta.dirname, "client"));
