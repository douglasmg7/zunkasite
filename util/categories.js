'use strict';

// The order is important.
let categories = [
	{ name: 'Memorias notebook', regex: /\bmem[oó]rias?\s*(de\s*)?notebooks?\b/i},
	{ name: 'Memórias', regex: /\bmem[oÓ]rias?\b/i},
	{ name: 'Monitores', regex: /\bmonitor(es)?\b/i},
	// { name: 'Mouses', regex: 'Mouses'},
	// { name: 'Notebook Acessórios', regex: 'Notebook Acessórios'},
	// { name: 'Notebooks', regex: 'Notebooks'},
	// { name: 'Pen drives', regex: 'Pen drives'},
	// { name: 'Placas de Video', regex: 'Placas de Video'},
	// { name: 'Placas mãe', regex: 'Placas mãe'},
	// { name: 'Processadores', regex: 'Processadores'},
	// { name: 'Redes', regex: 'Redes'},
	// { name: 'SSDs', regex: 'SSDs'},
	// { name: 'Teclados', regex: 'Teclados'},
	// { name: 'Ventoinhas', regex: 'Ventoinhas'},
	// { name: 'Webcameras', regex: 'Webcameras'},
	// { name: 'Gabinetes', regex: ['gabinetes', 'gabinete', 'gabinete de computadore']},
	// { name: 'Fones de ouvido', regex: ['fones de ouvido', 'fone de ouvido']},
	// { name: 'Computadores', regex: ['computadores', 'computador']},
	// { name: 'Adaptadores', regex: ['adaptadores', 'adaptador']},
	// { name: 'Gravadores', regex: ['gravadores', 'gravador']},
	// { name: 'HDs notebook', regex: ['hds notebook', 'hd notebook', 'hds de notebook', 'hd de notebook']},
	// { name: 'HDs externos', regex: ['hds externos', 'hd externo']},
	// { name: 'HDs', regex: ['hds', 'hd']},
	// { name: 'Cabos', regex: ['cabos', 'cabo']},
	// { name: 'Cartões', regex: ['cartões', 'cartão', 'cartoes', 'cartao']},
	// { name: 'Coolers', regex: ['coolers', 'cooler']},
	// { name: 'Fontes', regex: ['fontes', 'fonte']},
	// { name: 'Energia', regex: ['energia']},
	// { name: 'Diversos', regex: ['diversos']},
];

// Select category.
function selectCategory(text) {
	let category = "";
	categories.forEach(item=>{
		if (item.regex.test(text)) {
			console.log(`category selected a: ${item.name}`);
			category = item.name;
		}
	});
	return category;
}

module.exports.selectCategory = selectCategory;
