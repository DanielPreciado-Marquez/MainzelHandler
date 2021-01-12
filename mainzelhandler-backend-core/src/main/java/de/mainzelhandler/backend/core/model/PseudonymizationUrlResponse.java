package de.mainzelhandler.backend.core.model;

/**
 * POJO class for the response of a pseudonymization URL request.
 */
public class PseudonymizationUrlResponse {

	/**
	 * Indicates whether the depseudonymization of the returned tokens triggers the
	 * callback request.
	 */
	private boolean useCallback;

	/**
	 * Array containing the requested URLs. Each URL contains a different token.
	 */
	private String[] urlTokens;

	/**
	 * Constructs a new PseudonymizationUrlResponse.
	 *
	 * @param useCallback Indicates whether the depseudonymization of the returned
	 *                    tokens triggers the callback request.
	 * @param urlTokens   Array containing the requested URLs. Each URL contains a
	 *                    different token.
	 */
	public PseudonymizationUrlResponse(final boolean useCallback, final String[] urlTokens) {
		this.useCallback = useCallback;
		this.urlTokens = urlTokens;
	}

	/**
	 * @return Indicates whether the depseudonymization of the returned tokens
	 *         triggers the callback request.
	 */
	public boolean isUseCallback() {
		return useCallback;
	}

	/**
	 * @param useCallback Indicates whether the depseudonymization of the returned
	 *                    tokens triggers the callback request.
	 */
	public void setUseCallback(final boolean useCallback) {
		this.useCallback = useCallback;
	}

	/**
	 * @return Array containing the requested URLs. Each URL contains a different
	 *         token.
	 */
	public String[] getUrlTokens() {
		return urlTokens;
	}

	/**
	 * @param urlTokens Array containing the requested URLs. Each URL contains a
	 *                  different token.
	 */
	public void setUrlTokens(final String[] urlTokens) {
		this.urlTokens = urlTokens;
	}

}
