'use strict';

// The order of items matter.
let regexMakers = [
	{ name: 'Acer', regex: /\bacer\b/i},
	{ name: 'AMD', regex: /\bamd\b/i},
	{ name: 'AOC', regex: /\baoc\b/i},
	{ name: 'Asus', regex: /\basus\b/i},
	{ name: 'D-Link', regex: /\bd-?link\b/i},
	{ name: 'Dell', regex: /\bdell\b/i},
	{ name: 'Nvidia', regex: /\bnvidia\b/i},
	{ name: 'Intel', regex: /\bintel\b/i},
	{ name: 'Kingston', regex: /\bkingston\b/i},
	{ name: 'LG', regex: /\blg\b/i},
	{ name: 'Seagate', regex: /\bseagate\b/i},
	{ name: 'TP-Link', regex: /\btp-?link\b/i},
	{ name: 'Western', regex: /\bwestern\b/i},
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
			console.log(`maker selected a: ${item.name}`);
			maker = item.name;
		}
	});
	return maker;
}

module.exports.makers = makers;
module.exports.selectMaker = selectMaker;
