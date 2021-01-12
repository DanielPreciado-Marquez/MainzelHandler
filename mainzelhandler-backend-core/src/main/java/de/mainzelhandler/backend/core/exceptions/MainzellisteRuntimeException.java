package de.mainzelhandler.backend.core.exceptions;

public class MainzellisteRuntimeException extends RuntimeException {

	/**
	 * Generated serialVersionUID.
	 */
	private static final long serialVersionUID = -4296163360023845422L;

	/**
	 * Constructs a new MainzellisteException.
	 *
	 * @param message The detail message.
	 */
	public MainzellisteRuntimeException(final String message) {
		super(message);
	}

	/**
	 * Constructs a new MainzellisteException.
	 *
	 * @param message The detail message.
	 * @param cause   The cause. (A null value is permitted, and indicates that the
	 *                cause is nonexistent or unknown.)
	 */
	public MainzellisteRuntimeException(final String message, final Throwable cause) {
		super(message, cause);
	}

	/**
	 * Constructs a new MainzellisteException.
	 *
	 * @param cause The cause. (A null value is permitted, and indicates that the
	 *              cause is nonexistent or unknown.)
	 */
	public MainzellisteRuntimeException(final Throwable cause) {
		super(cause);
	}

}
