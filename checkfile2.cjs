const fs = require('fs');
const b = fs.readFileSync('C:\\Users\\prajv\\locket\\src\\components\\QuotesPage.tsx');

// Check around the error position
// Line 172 column 70 - let's find the exact byte offset
let lineCount = 0;
let charCount = 0;
let targetOffset = -1;

for(let i = 0; i < b.length; i++) {
    if(lineCount === 171 && charCount === 69) { // 0-indexed
        targetOffset = i;
        break;
    }
    if(b[i] === 10) { // LF
        lineCount++;
        charCount = 0;
    } else {
        charCount++;
    }
}

console.log('Target offset:', targetOffset);
if(targetOffset >= 0) {
    let out = '';
    for(let i = targetOffset - 10; i < targetOffset + 20; i++) {
        let c = b[i];
        if(c === 10) out += '\\n[LF]';
        else if(c === 13) out += '[CR]';
        else if(c === 34) out += '"';
        else if(c >= 32 && c < 127) out += String.fromCharCode(c);
        else out += '[' + c + ']';
    }
    console.log('Around error:', out);
    
    // Print byte values
    for(let i = targetOffset - 5; i < targetOffset + 15; i++) {
        console.log(i, ':', b[i], String.fromCharCode(b[i]));
    }
}