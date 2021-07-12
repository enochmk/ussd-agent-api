const isAlphabetString = require('./isAlphabetString');

const formatGhanaCard = (GhanaCardString) => {
	if (GhanaCardString.length < 13) {
		return null;
	}

	// if the length is equal to 13: GHA1234567890
	if (GhanaCardString.length === 13) {
		const head = GhanaCardString.slice(0, 3);
		const middle = GhanaCardString.slice(3, 12);
		const end = GhanaCardString.slice(12, 13);

		GhanaCardString = `${head}-${middle}-${end}`;
	}

	if (GhanaCardString.length !== 15) {
		return null;
	}

	if (!isAlphabetString(GhanaCardString.slice(0, 3))) {
		return null;
	}

	return GhanaCardString;
};

module.exports = formatGhanaCard;
