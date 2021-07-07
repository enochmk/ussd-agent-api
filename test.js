const AgentMenu = require('./data/AgentMenu.json');

const Questions = AgentMenu.non_bio_registration_mfs;

let keys = Object.keys(Questions);
let values = Object.values(Questions);

let key = 'end';

let index = keys.indexOf(key);
console.log(values[index]);

return;

let nextIndex = keys.indexOf('2') + 1;
console.log(nextIndex);

// let nextItem = keys[nextIndex];
// console.log(nextItem);

let currentMenu = 'title';

console.log(menus);
