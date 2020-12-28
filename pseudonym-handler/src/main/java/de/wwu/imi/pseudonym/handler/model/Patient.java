package de.wwu.imi.pseudonym.handler.model;

public class Patient {

	/**
	 * Pseudonym of the Patient. Used to identify the Patient.
	 */
	private String pseudonym;

	/**
	 * Medical data of the patient. There are no further restrictions for the data.
	 */
	private String mdat;

	/**
	 * Indicates whether the patient could be merged with another patient. This
	 * occurs when the sureness parameter of the pseudonymization was set to true.
	 */
	private Boolean tentative;

	/**
	 * Constructs a new Patient.
	 */
	public Patient() {
	}

	/**
	 * Constructs a new Patient.
	 *
	 * @param pseudonym Pseudonym of the Patient. Used to identify the Patient.
	 * @param mdat      Medical data of the patient. There are no further
	 *                  restrictions for the data.
	 */
	public Patient(final String pseudonym, final String mdat) {
		this.pseudonym = pseudonym;
		this.mdat = mdat;
	}

	/**
	 * Constructs a new Patient.
	 *
	 * @param pseudonym Pseudonym of the Patient. Used to identify the Patient.
	 * @param mdat      Medical data of the patient. There are no further
	 *                  restrictions for the data.
	 * @param tentative Indicates whether the patient could be merged with another
	 *                  patient.
	 */
	public Patient(final String pseudonym, final String mdat, final Boolean tentative) {
		this.pseudonym = pseudonym;
		this.mdat = mdat;
		this.tentative = tentative;
	}

	/**
	 * @return Pseudonym of the Patient. Used to identify the Patient.
	 */
	public String getPseudonym() {
		return pseudonym;
	}

	/**
	 * @param pseudonym Pseudonym of the Patient. Used to identify the Patient.
	 */
	public void setPseudonym(final String pseudonym) {
		this.pseudonym = pseudonym;
	}

	/**
	 * @return Medical data of the patient. There are no further restrictions for
	 *         the data.
	 */
	public String getMdat() {
		return mdat;
	}

	/**
	 * @param mdat Medical data of the patient. There are no further restrictions
	 *             for the data.
	 */
	public void setMdat(final String mdat) {
		this.mdat = mdat;
	}

	/**
	 * @return Indicates whether the patient could be merged with another patient.
	 */
	public Boolean isTentative() {
		return tentative;
	}

	/**
	 * @param tentative Indicates whether the patient could be merged with another
	 *                  patient.
	 */
	public void setTentative(final Boolean tentative) {
		this.tentative = tentative;
	}

	/**
	 * Determines if two patients are equal. Two patients are equal if the
	 * pseudonym, the mdat and the tentative value are equal.
	 */
	@Override
	public boolean equals(final Object object) {

		if (!(object instanceof Patient))
			return false;

		final Patient patient = (Patient) object;

		final boolean pseudonymEqual = pseudonym == null ? patient.pseudonym == null
				: pseudonym.equals(patient.pseudonym);
		final boolean mdatEqual = mdat == null ? patient.mdat == null : mdat.equals(patient.mdat);
		final boolean tentativeEqual = tentative == null ? patient.tentative == null
				: tentative.equals(patient.tentative);

		return pseudonymEqual && mdatEqual && tentativeEqual;
	}

	@Override
	public String toString() {
		return "pseudonym: " + pseudonym + ", tentative: " + tentative + ", mdat: " + mdat;
	}

}
