package de.mainzelhandler.backend.core.model;

import java.util.List;

/**
 * POJO class for a depseudonymization URL request.
 */
public class DepseudonymizationUrlRequest {

	/**
	 * Pseudonyms to get depseudonymized.
	 */
	private List<String> pseudonyms;

	/**
	 * Names of PII fields to get returned by the depseudonymization.
	 */
	private List<String> resultFields;

	/**
	 * Constructs a new DepseudonymizationUrlRequest.
	 */
	public DepseudonymizationUrlRequest() {
	}

	/**
	 * Constructs a new DepseudonymizationUrlRequest.
	 *
	 * @param pseudonyms   Pseudonyms to get depseudonymized.
	 * @param resultFields Names of PII fields to get returned by the
	 *                     depseudonymization.
	 */
	public DepseudonymizationUrlRequest(final List<String> pseudonyms, final List<String> resultFields) {
		this.pseudonyms = pseudonyms;
		this.resultFields = resultFields;
	}

	/**
	 * @return Pseudonyms to get depseudonymized.
	 */
	public List<String> getPseudonyms() {
		return pseudonyms;
	}

	/**
	 * @param pseudonyms Pseudonyms to get depseudonymized.
	 */
	public void setPseudonyms(final List<String> pseudonyms) {
		this.pseudonyms = pseudonyms;
	}

	/**
	 * @return Names of PII fields to get returned by the depseudonymization.
	 */
	public List<String> getResultFields() {
		return resultFields;
	}

	/**
	 * @param resultFields Names of PII fields to get returned by the
	 *                     depseudonymization.
	 */
	public void setResultFields(final List<String> resultFields) {
		this.resultFields = resultFields;
	}

}
