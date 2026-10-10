const fs = require('fs');
const b = fs.readFileSync('C:\\Users\\prajv\\locket\\src\\components\\QuotesPage.tsx');
let out = '';
for(let i = 6490; i < 6560; i++) {
    let c = b[i];
    if(c === 10) out += '\n[LF]';
    else if(c === 13) out += '[CR]';
    else if(c === 34) out += '"';
    else if(c >= 32 && c < 127) out += String.fromCharCode(c);
    else out += '[' + c + ']';
}
console.log(out);