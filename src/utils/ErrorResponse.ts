class ErrorResponse extends Error {
	private statusCode: number;

	constructor(message: string, statusCode: number) {
		super(message);
		this.statusCode = statusCode;
	}
}

export default ErrorResponse;
