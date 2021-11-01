export default function isAlphaOrParen(str: string): boolean {
	return /^[a-zA-Z()]+$/.test(str);
}
