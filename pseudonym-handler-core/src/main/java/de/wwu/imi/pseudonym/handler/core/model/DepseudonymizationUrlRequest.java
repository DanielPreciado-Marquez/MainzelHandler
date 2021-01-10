package de.wwu.imi.pseudonym.handler.core.model;

import java.util.List;

public class DepseudonymizationUrlRequest {

	private List<String> pseudonyms;
	private List<String> resultFields;

	public DepseudonymizationUrlRequest() {
	}

	public DepseudonymizationUrlRequest(final List<String> pseudonyms, final List<String> resultFields) {
		this.pseudonyms = pseudonyms;
		this.resultFields = resultFields;
	}

	public List<String> getPseudonyms() {
		return pseudonyms;
	}

	public void setPseudonyms(final List<String> pseudonyms) {
		this.pseudonyms = pseudonyms;
	}

	public List<String> getResultFields() {
		return resultFields;
	}

	public void setResultFields(final List<String> resultFields) {
		this.resultFields = resultFields;
	}

}
