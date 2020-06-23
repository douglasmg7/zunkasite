'use strict';

// Check if is a valid mobile number.
function isValid(val) {
    // Remove "-", "(" and ")".
    val = val.replace(/-/g, "").replace(/\(/g, "").replace(/\)/g, "");
    // Check number of digits.
    if (val.length < 10 || val.length > 11) {
        return false;
    }
    return true;
};

// Format mobile number.
function format(val) {
    // Get only digits.
	val = val.match(/\d+/g);
	if (val == null) {
        return "";
	}
    val = val.join("");
    // Check number of digits.
    if (val.length < 10 || val.length > 11) {
        return "";
    }
	// Format mobile number.
    // Array [2][1][1+][4].
    let numberArray = val.match(/(^\d{2})(\d)(\d+)(\d{4})$/);
    // Format to "(00) 0000-0000" ou  "(00) 00000-0000"
    return `(${numberArray[1]}) ${numberArray[2]} ${numberArray[3]}-${numberArray[4]}`;
};

module.exports.isValid = isValid;
module.exports.format = format;
