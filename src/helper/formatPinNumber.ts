import isAlphabetString from './isAlphabetString';

const formatPinNumber = (pinNumber: string): string => {
	if (pinNumber.length < 13) {
		throw new Error('Invalid PIN Number');
	}

	// if the length is equal to 13: GHA1234567890
	if (pinNumber.length === 13) {
		const head = pinNumber.slice(0, 3);
		const middle = pinNumber.slice(3, 12);
		const end = pinNumber.slice(12, 13);

		pinNumber = `${head}-${middle}-${end}`;
	}

	if (pinNumber.length !== 15) {
		throw new Error('Invalid PIN Number');
	}

	if (!isAlphabetString(pinNumber.slice(0, 3))) {
		throw new Error('Invalid PIN Number');
	}

	return pinNumber;
};

module.exports = formatPinNumber;
