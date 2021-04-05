'use strict';

// The order of items matter.
let regexMakers = [
	{ name: 'Acer', regex: /\bacer\b/i},
	{ name: 'ADATA', regex: /\badata\b/i},
	{ name: 'Afox', regex: /\bafox\b/i},
	{ name: 'AMD', regex: /\bamd\b/i},
	{ name: 'AOC', regex: /\baoc\b/i},
	{ name: 'APC', regex: /\bapc\b/i},
	{ name: 'Asus', regex: /\basus\b/i},
	{ name: 'Brother', regex: /\bbrother\b/i},
	{ name: 'Cooler Master', regex: /\bcooler\s*master\b/i},
	{ name: 'Corsair', regex: /\bcorsair\b/i},
	{ name: 'D-Link', regex: /\bd-?link\b/i},
	{ name: 'Dell', regex: /\bdell\b/i},
	{ name: 'Dji', regex: /\bdji\b/i},
	{ name: 'Epson', regex: /\bepson\b/i},
	{ name: 'Galax', regex: /\bgalax\b/i},
	{ name: 'Gigabyte', regex: /\bgigabyte\b/i},
	{ name: 'HP', regex: /\bhp\b/i},
	{ name: 'Intel', regex: /\bintel\b/i},
	{ name: 'Intelbras', regex: /\bintelbras\b/i},
	{ name: 'Kingston', regex: /\bkingston\b/i},
	{ name: 'LG', regex: /\blg\b/i},
	{ name: 'Nvidia', regex: /\bnvidia\b/i},
	{ name: 'PowerColor', regex: /\bpowercolor\b/i},
	{ name: 'PNY', regex: /\bpny\b/i},
	{ name: 'Samsung', regex: /\bsamsung\b/i},
	{ name: 'Seagate', regex: /\bseagate\b/i},
	{ name: 'Smart', regex: /\bsmart\b/i},
	{ name: 'SMS', regex: /\bsms\b/i},
	{ name: 'TP-Link', regex: /\btp-?link\b/i},
	{ name: 'Vaio', regex: /\bvaio\b/i},
	{ name: 'Western', regex: /\bwestern\b/i},
	{ name: 'Zotac', regex: /\bzotac\b/i},
];

// Makers list.
let makers = []; 
regexMakers.forEach(item=>{
	makers.push(item.name);
});
makers.sort();
// console.log(`Generated Product makers: ${makers}`);

// Select maker.
function selectMaker(text) {
	let maker = "";
	regexMakers.forEach(item=>{
		if (item.regex.test(text)) {
			// console.log(`maker selected a: ${item.name}`);
			maker = item.name;
		}
	});
	return maker;
}

module.exports.makers = makers;
module.exports.selectMaker = selectMaker;
