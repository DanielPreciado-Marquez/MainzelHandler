package de.wwu.imi.pseudonym.handler.core.model;

public class PseudonymizationUrlRequest {

	private Integer count;

	public PseudonymizationUrlRequest() {
	}

	public PseudonymizationUrlRequest(final Integer count) {
		this.count = count;
	}

	public Integer getCount() {
		return count;
	}

	public void setCount(final Integer amount) {
		this.count = amount;
	}

}
