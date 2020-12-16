package de.wwu.imi.pseudonymizer.lib.model;

import org.json.JSONObject;

public class Patient {

	/**
	 * Pseudonym of the Patient. Used to identify the Patient.
	 */
	private String pseudonym;

	/**
	 * Medical data of the patient. There are no further restrictions for the data.
	 */
	private String mdat;

	public Patient() {
	}

	public Patient(final String pseudonym, final String mdat) {
		this.pseudonym = pseudonym;
		this.mdat = mdat;
	}

	public String getPseudonym() {
		return pseudonym;
	}

	public void setPseudonym(final String pseudonym) {
		this.pseudonym = pseudonym;
	}

	public String getMdat() {
		return mdat;
	}

	public void setMdat(final String mdat) {
		this.mdat = mdat;
	}

	/**
	 * Determines if two patients are equal. Two patients are equal if the pseudonym
	 * and the mdat are equal.
	 *
	 * @see JSONObject#similar(Object)
	 */
	@Override
	public boolean equals(final Object object) {

		if (!(object instanceof Patient))
			return false;

		final var patient = (Patient) object;

		final boolean pseudonymEqual = pseudonym == null ? patient.pseudonym == null
				: pseudonym.equals(patient.pseudonym);
		final boolean mdatEqual = mdat == null ? patient.mdat == null : mdat.equals(patient.mdat);

		return pseudonymEqual && mdatEqual;
	}

	@Override
	public String toString() {
		return "pseudonym: " + pseudonym + ", mdat: " + mdat;
	}

}
