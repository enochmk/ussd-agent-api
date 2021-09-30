function isAlphaOrParen(str) {
	return /^[a-zA-Z()]+$/.test(str);
}

module.exports = isAlphaOrParen;
