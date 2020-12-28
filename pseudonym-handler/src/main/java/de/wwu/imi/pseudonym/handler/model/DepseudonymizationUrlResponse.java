package de.wwu.imi.pseudonym.handler.model;

import java.util.List;

import de.wwu.imi.pseudonym.handler.controller.AbstractPseudonymizationController;

/**
 * Container class for the response of
 * {@link AbstractPseudonymizationController#getDepseudonymizationURL(List)}.
 * Contains the depseudonymization URL and a list of the invalid pseudonyms from
 * the corresponding request.
 */
public class DepseudonymizationUrlResponse {

	private String url;

	private List<String> invalidPseudonyms;

	public DepseudonymizationUrlResponse(final String psedonymizationUrl, final List<String> invlaidPseudonyms) {
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
