const regex = new RegExp(`\\\\btest\\\\b`, 'i');
console.log(regex);
console.log(regex.test('this is a test string'));
