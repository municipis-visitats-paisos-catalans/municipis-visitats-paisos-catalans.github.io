const fs = require('fs');

const files = [
  'alguer.geojson',
  'andorra.geojson',
  'carxe.geojson',
  'catalunya.geojson',
  'catnord.geojson',
  'franja.geojson',
  'illes.geojson',
  'pv.geojson'
];

files.forEach(file => {
  const input = fs.createReadStream(file, 'utf8');
  const tempFile = file + '.tmp';
  const output = fs.createWriteStream(tempFile);

  let insideCoords = false;
  let bracketCount = 0;
  let carry = '';

  input.on('data', chunk => {
    let text = carry + chunk;
    let result = '';

    for (let i = 0; i < text.length; i++) {
      if (!insideCoords) {
        if (text.slice(i, i + 13) === '"coordinates"') {
          insideCoords = true;
          result += '"coordinates"';
          i += 12;
          continue;
        }
        result += text[i];
      } else {
        const c = text[i];

        if (c === '[') bracketCount++;
        if (c === ']') bracketCount--;

        if (!/\s/.test(c)) result += c;

        if (bracketCount === 0 && c === ']') {
          insideCoords = false;
        }
      }
    }

    carry = '';
    output.write(result);
  });

  input.on('end', () => {
    output.end(() => {
      fs.renameSync(tempFile, file);
      console.log(`OK: ${file}`);
    });
  });

  input.on('error', err => console.error(`Error llegint ${file}:`, err));
});
