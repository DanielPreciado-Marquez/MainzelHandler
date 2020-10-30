package de.wwu.imi.pseudonymizer.lib.model;

import java.util.List;

import de.wwu.imi.pseudonymizer.lib.controller.AbstractPseudonymizationController;

/**
 * Container class for the response of
 * {@link AbstractPseudonymizationController#getDepseudonymizationURL(List)}.
 * Contains the depseudonymization URL and a list of the invalid pseudonyms from
 * the corresponding request.
 */
public class DepseudonymizationResponse {

	private String url;

	private List<String> invalidPseudonyms;

	public DepseudonymizationResponse(final String psedonymizationUrl, final List<String> invlaidPseudonyms) {
		this.url = psedonymizationUrl;
		this.invalidPseudonyms = invlaidPseudonyms;
	}

	public String getUrl() {
		return url;
	}

	public void setUrl(final String pseudonymizationUrl) {
		this.url = pseudonymizationUrl;
	}

	public List<String> getInvalidPseudonyms() {
		return invalidPseudonyms;
	}

	public void setInvalidPseudonyms(final List<String> invalidPseudonyms) {
		this.invalidPseudonyms = invalidPseudonyms;
	}

}
