package de.wwu.imi.pseudonymizer.lib.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(code = HttpStatus.SERVICE_UNAVAILABLE)
public class PseudonymizationServerException extends RuntimeException {

	/**
	 * Generated serialVersionUID.
	 */
	private static final long serialVersionUID = -4296163360023845422L;
	
	public PseudonymizationServerException(final String message) {
		super(message);
	}
	
	public PseudonymizationServerException(final String message, final Throwable cause) {
		super(message, cause);
	}

}
