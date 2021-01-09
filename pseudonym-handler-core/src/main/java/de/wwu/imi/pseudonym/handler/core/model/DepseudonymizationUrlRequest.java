package de.wwu.imi.pseudonym.handler.core.model;

import java.util.List;

public class DepseudonymizationUrlRequest {

	private List<String> pseudonyms;
	private List<String> resultFields;

	public List<String> getPseudonyms() {
		return pseudonyms;
	}

	public void setPseudonyms(List<String> pseudonyms) {
		this.pseudonyms = pseudonyms;
	}

	public List<String> getResultFields() {
		return resultFields;
	}

	public void setResultFields(List<String> resultFields) {
		this.resultFields = resultFields;
	}

}
