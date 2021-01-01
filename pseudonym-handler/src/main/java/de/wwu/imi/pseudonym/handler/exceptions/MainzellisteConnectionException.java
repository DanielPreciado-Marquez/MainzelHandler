package de.wwu.imi.pseudonym.handler.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * RuntimeException indicating an issue with the connection to the Mainzelliste.
 */
@ResponseStatus(code = HttpStatus.SERVICE_UNAVAILABLE)
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
