package de.wwu.imi.pseudonym.handler.core.model;

public class PseudonymizationUrlRequest {

	private Integer amount;

	public PseudonymizationUrlRequest(final Integer amount) {
		this.amount = amount;
	}

	public Integer getAmount() {
		return amount;
	}

	public void setAmount(final Integer amount) {
		this.amount = amount;
	}

}
