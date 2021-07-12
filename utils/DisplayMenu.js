const formatGhanaCard = require('./formatGhanaCard');

const confirmMenuNonBioReg = (answers) => {
	let menu = `MSISDN: ${answers[1]}\nLast 6 Digit of ICCID: ${
		answers[2]
	}\nID: ${formatGhanaCard(answers[3])}\nFirstName(s): ${
		answers[4]
	}\nSurname: ${answers[5]}\nSex: ${
		answers[6] == 1 ? 'Male' : 'Female'
	}\nDOB: ${answers[7]}\nWant AirtelTigo Money?: ${
		answers[8] == 1 ? 'Yes' : 'No'
	}\nNext Of Kin: ${
		answers[9] || 'N/A'
	}\n\n1.Confirm above the details\n2.Cancel`.trim();

	return menu;
};

const confirmMenuNonBioRegMFS = (answers) => {
	menu = `MSISDN: ${answers[1]}\nID: ${answers[2]}\nFirstNames: ${
		answers[3]
	}\nSurname: ${answers[4]}\nSex: ${
		answers[5] == 1 ? 'Male' : 'Female'
	}\nDOB: ${answers[6]}\nNext Of Kin: ${
		answers[7]
	}\n\n1.Confirm above the details \n2.Cancel`;

	return menu;
};

const confirmMenuBioReReg = (answers) => {
	menu = `MSISDN: ${answers[1]}\nID: ${answers[2]}\nVerification Receipt NO: ${answers[3]}\n\n1.Confirm above the details \n2.Cancel`;

	return menu;
};

const confirmMenuBioReg = (answers) => {
	menu = `MSISDN: ${answers[1]}\nLast 6 Digit of ICCID: ${answers[2]}\nID: ${
		answers[3]
	}\nVerification Receipt NO: ${answers[4]}\nWant AirtelTigo Money?: ${
		answers[5] == 1 ? 'Yes' : 'No'
	}\nNext Of Kin: ${answers[6]}\n\n1.Confirm above the details \n2.Cancel`;

	return menu;
};

module.exports = {
	confirmMenuBioReReg,
	confirmMenuBioReg,
	confirmMenuNonBioRegMFS,
	confirmMenuNonBioReg,
};
