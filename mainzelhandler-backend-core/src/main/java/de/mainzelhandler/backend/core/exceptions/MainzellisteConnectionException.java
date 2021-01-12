package de.mainzelhandler.backend.core.exceptions;

/**
 * RuntimeException indicating an issue with the connection to the Mainzelliste.
 */
public class MainzellisteConnectionException extends RuntimeException {

	/**
	 * Generated serialVersionUID.
	 */
	private static final long serialVersionUID = 8261542004053033104L;

	/**
	 * Constructs a new MainzellisteConnectionException.
	 *
	 * @param message The detail message.
	 */
	public MainzellisteConnectionException(final String message) {
		super(message);
	}

	/**
	 * Constructs a new MainzellisteConnectionException.
	 *
	 * @param message The detail message.
	 * @param cause   The cause. (A null value is permitted, and indicates that the
	 *                cause is nonexistent or unknown.)
	 */
	public MainzellisteConnectionException(final String message, final Throwable cause) {
		super(message, cause);
	}

	/**
	 * Constructs a new MainzellisteConnectionException.
	 *
	 * @param cause The cause. (A null value is permitted, and indicates that the
	 *              cause is nonexistent or unknown.)
	 */
	public MainzellisteConnectionException(final Throwable cause) {
		super(cause);
	}

}
