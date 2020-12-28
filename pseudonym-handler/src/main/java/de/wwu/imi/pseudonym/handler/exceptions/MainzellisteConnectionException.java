package de.wwu.imi.pseudonym.handler.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(code = HttpStatus.SERVICE_UNAVAILABLE)
public class MainzellisteConnectionException extends RuntimeException {

	/**
	 * Generated serialVersionUID.
	 */
	private static final long serialVersionUID = 8261542004053033104L;

	public MainzellisteConnectionException(final String message) {
		super(message);
	}

	public MainzellisteConnectionException(final String message, final Throwable cause) {
		super(message, cause);
	}

	public MainzellisteConnectionException(final Throwable cause) {
		super(cause);
	}

}
