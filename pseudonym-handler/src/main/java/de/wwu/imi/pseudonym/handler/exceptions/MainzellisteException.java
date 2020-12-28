package de.wwu.imi.pseudonym.handler.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * RuntimeException indicating an issue at the Mainzelliste.
 */
@ResponseStatus(code = HttpStatus.SERVICE_UNAVAILABLE)
public class MainzellisteException extends RuntimeException {

	/**
	 * Generated serialVersionUID.
	 */
	private static final long serialVersionUID = -4296163360023845422L;

	/**
	 * Constructs a new MainzellisteException.
	 *
	 * @param message The detail message.
	 */
	public MainzellisteException(final String message) {
		super(message);
	}

	/**
	 * Constructs a new MainzellisteException.
	 *
	 * @param message The detail message.
	 * @param cause   The cause. (A null value is permitted, and indicates that the
	 *                cause is nonexistent or unknown.)
	 */
	public MainzellisteException(final String message, final Throwable cause) {
		super(message, cause);
	}

	/**
	 * Constructs a new MainzellisteException.
	 *
	 * @param cause The cause. (A null value is permitted, and indicates that the
	 *              cause is nonexistent or unknown.)
	 */
	public MainzellisteException(final Throwable cause) {
		super(cause);
	}

}
