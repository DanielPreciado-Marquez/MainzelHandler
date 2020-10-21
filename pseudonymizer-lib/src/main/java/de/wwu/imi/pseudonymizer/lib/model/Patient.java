package de.wwu.imi.pseudonymizer.lib.model;

import org.json.JSONObject;

public class Patient {

	/**
	 * Pseudonym of the Patient. Used to identify the Patient.
	 */
	private String pseudonym;

	/**
	 * Medical data of the patient. There are no further restrictions for the data.
	 * It can be null, empty or contain any valid key value pair.
	 */
	private JSONObject mdat;

	public Patient() {
	}

	public Patient(final String pseudonym, final String mdat) {
		this.pseudonym = pseudonym;
		this.mdat = new JSONObject(mdat);
	}

	public Patient(final String pseudonym, final JSONObject mdat) {
		this.pseudonym = pseudonym;
		this.mdat = mdat;
	}

	public String getPseudonym() {
		return pseudonym;
	}

	public void setPseudonym(final String pseudonym) {
		this.pseudonym = pseudonym;
	}

	public JSONObject getMdat() {
		return mdat;
	}

	public String getMdatString() {
		return mdat.toString();
	}

	public void setMdat(final JSONObject mdat) {
		this.mdat = mdat;
	}

	public void setMdat(final String mdat) {
		this.mdat = new JSONObject(mdat);
	}

	/**
	 * Determines if two patients are equal. Two patients are equal, if the
	 * pseudonyms are equal and the mdat's are similar.
	 *
	 * @see JSONObject#similar(Object)
	 */
	@Override
	public boolean equals(final Object object) {

		if (!(object instanceof Patient))
			return false;

		final var patient = (Patient) object;

		return (pseudonym == patient.pseudonym && mdat.similar(patient.mdat));
	}

	@Override
	public String toString() {
		return "pseudonym: " + pseudonym + ", mdat: " + mdat;
	}

}
