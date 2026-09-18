// Optional authoring tool: requires sharp. The site serves the committed assets.
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');

(async () => {
  const root = path.join(__dirname, '..');
  const logo = await fs.readFile(path.join(root, 'assets/mode-mode-logo.svg'), 'utf8');
  const paths = [...logo.matchAll(/<path d="([^"]+)"/g)].map(match => match[1]);
  const upper = paths.find(d => d.startsWith('M46.69,44.23'));
  const lower = paths.find(d => d.startsWith('M284.67,191.85'));
  if (!upper || !lower) throw new Error('The source wordmark M paths could not be found.');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="#000">
  <title>MODE MODE</title>
  <path transform="translate(20 6)" d="${upper}"/>
  <path transform="translate(-107.72 -16.24)" d="${lower}"/>
</svg>
`;
  await fs.writeFile(path.join(root, 'favicon.svg'), svg);

  // ICO directory with transparent PNG frames for standard browser tab sizes.
  const sizes = [16, 32, 48];
  const frames = await Promise.all(sizes.map(size => sharp(Buffer.from(svg))
    .resize(size, size).png().toBuffer()));
  const directory = Buffer.alloc(6 + 16 * sizes.length);
  directory.writeUInt16LE(1, 2);
  directory.writeUInt16LE(sizes.length, 4);
  let offset = directory.length;
  for (let i = 0; i < sizes.length; i++) {
    const entry = 6 + 16 * i;
    directory[entry] = directory[entry + 1] = sizes[i];
    directory.writeUInt16LE(1, entry + 4);
    directory.writeUInt16LE(32, entry + 6);
    directory.writeUInt32LE(frames[i].length, entry + 8);
    directory.writeUInt32LE(offset, entry + 12);
    offset += frames[i].length;
  }
  await fs.writeFile(path.join(root, 'favicon.ico'), Buffer.concat([directory, ...frames]));
  console.log('Generated transparent black MM favicon (SVG and 16/32/48px ICO).');
})();
