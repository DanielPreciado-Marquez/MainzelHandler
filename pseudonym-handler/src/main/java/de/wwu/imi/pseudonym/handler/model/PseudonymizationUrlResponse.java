package de.wwu.imi.pseudonym.handler.model;

public class PseudonymizationUrlResponse {

	private boolean useCallback;

	private String[] urlTokens;

	public PseudonymizationUrlResponse(final boolean useCallback, final String[] urlTokens) {
		this.useCallback = useCallback;
		this.urlTokens = urlTokens;
	}

	public boolean isUseCallback() {
		return useCallback;
	}

	public void setUseCallback(final boolean useCallback) {
		this.useCallback = useCallback;
	}

	public String[] getUrlTokens() {
		return urlTokens;
	}

	public void setUrlTokens(final String[] urlTokens) {
		this.urlTokens = urlTokens;
	}

}
