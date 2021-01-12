package de.wwu.imi.pseudonym.handler.core.model;

/**
 * POJO class for a pseudonymization URL request.
 */
public class PseudonymizationUrlRequest {

	/**
	 * Number of the requested readPatient token.
	 */
	private Integer count;

	/**
	 * Constructs a new PseudonymizationUrlRequest.
	 */
	public PseudonymizationUrlRequest() {
	}

	/**
	 * Constructs a new PseudonymizationUrlRequest.
	 *
	 * @param count Number of the requested readPatient token.
	 */
	public PseudonymizationUrlRequest(final Integer count) {
		this.count = count;
	}

	/**
	 * @return Number of the requested readPatient token.
	 */
	public Integer getCount() {
		return count;
	}

	/**
	 * @param count Number of the requested readPatient token.
	 */
	public void setCount(final Integer count) {
		this.count = count;
	}

}
