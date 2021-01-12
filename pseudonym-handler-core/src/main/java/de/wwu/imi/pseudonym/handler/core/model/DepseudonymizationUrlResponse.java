package de.wwu.imi.pseudonym.handler.core.model;

import java.util.List;

/**
 * Container class for the response of a depseudonymization URL request.
 * Contains the depseudonymization URL and a list of the invalid pseudonyms from
 * the corresponding request.
 */
public class DepseudonymizationUrlResponse {

	/**
	 * URL for the depseudonymization.
	 */
	private String url;

	/**
	 * List of invalid pseudonyms.
	 */
	private List<String> invalidPseudonyms;

	/**
	 * Constructs a new DepseudonymizationUrlResponse.
	 *
	 * @param psedonymizationUrl URL for the depseudonymization.
	 * @param invlaidPseudonyms  List of invalid pseudonyms.
	 */
	public DepseudonymizationUrlResponse(final String psedonymizationUrl, final List<String> invlaidPseudonyms) {
		this.url = psedonymizationUrl;
		this.invalidPseudonyms = invlaidPseudonyms;
	}

	/**
	 * @return URL for the depseudonymization.
	 */
	public String getUrl() {
		return url;
	}

	/**
	 * @param pseudonymizationUrl URL for the depseudonymization.
	 */
	public void setUrl(final String pseudonymizationUrl) {
		this.url = pseudonymizationUrl;
	}

	/**
	 * @return List of invalid pseudonyms.
	 */
	public List<String> getInvalidPseudonyms() {
		return invalidPseudonyms;
	}

	/**
	 * @param invalidPseudonyms List of invalid pseudonyms.
	 */
	public void setInvalidPseudonyms(final List<String> invalidPseudonyms) {
		this.invalidPseudonyms = invalidPseudonyms;
	}

}
