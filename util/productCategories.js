'use strict';

// The order of items matter.
let regexCategories = [
	{ name: 'Notebook Acessórios', regex: /\bnotebooks?\s+acess[oó]rios?\b/i},
	{ name: 'Placas de Vídeo', regex: /\bplacas?\s+de\s+v[ií]deo\b/i},
	{ name: 'Placas mãe', regex: /\bplacas?\s+m[aã]e\b/i},
	{ name: 'Fones de ouvido', regex: /\bfones?(\s+de\s+)ouvido\b/i},
	{ name: 'HDs notebook', regex: /\bhds?\s+(de\s+)?notebooks?\b/i},
	{ name: 'HDs externos', regex: /\bhds?\s+externos?\b/i},
	{ name: 'Memórias notebook', regex: /\bmem[oó]rias?\s*(de\s*)?notebooks?\b/i},
	{ name: 'Memórias', regex: /\bmem[oÓ]rias?\b/i},
	{ name: 'Monitores', regex: /\bmonitor(es)?\b/i},
	{ name: 'Mouses', regex: /\bmouses?\b/i},
	{ name: 'Notebooks', regex: /\bnotebooks?\b/i},
	{ name: 'Processadores', regex: /\bprocessador(es)?\b/i},
	{ name: 'Redes', regex: /\bRedes?\b/i},
	{ name: 'SSDs', regex: /\bssds?\b/i},
	{ name: 'Teclados', regex: /\bteclados?\b/i},
	{ name: 'Ventoinhas', regex: /\bventoinhas?\b/i},
	{ name: 'Webcameras', regex: /\bwebcameras?\b/i},
	{ name: 'Gabinetes', regex: /\bgabinetes?\b/i},
	{ name: 'Computadores', regex: /\bcomputador(es)?\b/i},
	{ name: 'Adaptadores', regex: /\badaptador(es)?\b/i},
	{ name: 'Gravadores', regex: /\bgravador(es)?\b/i},
	{ name: 'HDs', regex: /\bhds?\b/i},
	{ name: 'Cabos', regex: /\bcabos?\b/i},
	{ name: 'Cartões', regex: /\bcart(ao|ão|oes|ões)\b/i},
	{ name: 'Coolers', regex: /\bcoolers?\b/i},
	{ name: 'Fontes', regex: /\bfontes?\b/i},
	{ name: 'Energia', regex: /\benergia\b/i},
	{ name: 'Diversos', regex: /\bdiversos?\b/i},
	{ name: 'Pen drives', regex: /\bpen\s+drives?\b/i},
];

// Categories list.
let categories = []; 
regexCategories.forEach(item=>{
	categories.push(item.name);
});
categories.sort();
// console.log(`Generated Product categires: ${categories}`);

// Select category.
function selectCategory(text) {
	let category = "";
	regexCategories.forEach(item=>{
		if (item.regex.test(text)) {
			console.log(`category selected a: ${item.name}`);
			category = item.name;
		}
	});
	return category;
}

module.exports.categories = categories;
module.exports.selectCategory = selectCategory;
