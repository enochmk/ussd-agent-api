export default (phoneNumberString: string): string => {
	let cleaned = ('' + phoneNumberString).replace(/\D/g, '');
	let match10 = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
	let match09 = cleaned.match(/^(\d{2})(\d{3})(\d{4})$/);

	if (match10) {
		return match10[1] + '-' + match10[2] + '-' + match10[3];
	} else if (match09) {
		return '0' + match09[1] + '-' + match09[2] + '-' + match09[3];
	}

	// return default
	return phoneNumberString;
};
