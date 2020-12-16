package de.wwu.imi.demonstrator.app.entities;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

import de.wwu.imi.pseudonymizer.lib.model.Patient;

@Entity
@Table(name = "patient")
public class PatientEntity {

	@Id
	@Column(name = "pseudonym")
	private String pseudonym;

	@Column(name = "mdat")
	private String mdat;

	public PatientEntity() {
	}

	public PatientEntity(final String pseudonym, final String mdat) {
		this.pseudonym = pseudonym;
		this.mdat = mdat;
	}

	public PatientEntity(final Patient patient) {
		this.pseudonym = patient.getPseudonym();
		this.mdat = patient.getMdat();
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

	@Override
	public String toString() {
		return "pseudonym: " + pseudonym + ", mdat: " + mdat;
	}

}
