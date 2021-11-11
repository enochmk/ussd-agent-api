import isAlphabetString from './isAlphabetString';

const formatPinNumber = (pinNumber: string): string | null => {
	// invalid length
	if (pinNumber.length !== 13 && pinNumber.length !== 15) {
		return null;
	}

	// first 3 not a character
	if (!isAlphabetString(pinNumber.slice(0, 3))) {
		return null;
	}

	// if the length is equal to 13: GHA1234567890
	if (pinNumber.length === 13) {
		const head = pinNumber.slice(0, 3);
		const middle = pinNumber.slice(3, 12);
		const end = pinNumber.slice(12, 13);

		pinNumber = `${head}-${middle}-${end}`;
	}

	return pinNumber;
};

export default formatPinNumber;
