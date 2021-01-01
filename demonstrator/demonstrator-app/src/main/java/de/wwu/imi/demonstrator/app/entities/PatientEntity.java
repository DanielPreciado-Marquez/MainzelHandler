package de.wwu.imi.demonstrator.app.entities;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

import de.wwu.imi.pseudonym.handler.model.Patient;

@Entity
@Table(name = "patient")
public class PatientEntity {

	@Id
	@Column(name = "pseudonym")
	private String pseudonym;

	@Column(name = "mdat")
	private String mdat;

	@Column(name = "tentative")
	private boolean tentative;

	public PatientEntity() {
	}

	public PatientEntity(final String pseudonym, final String mdat, final boolean tentative) {
		this.pseudonym = pseudonym;
		this.mdat = mdat;
		this.tentative = tentative;
	}

	public PatientEntity(final Patient patient) {
		this.pseudonym = patient.getPseudonym();
		this.mdat = patient.getMdat();
		this.tentative = patient.isTentative();
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

	public boolean isTentative() {
		return tentative;
	}

	public void setTentative(final boolean tentative) {
		this.tentative = tentative;
	}

	@Override
	public String toString() {
		return "pseudonym: " + pseudonym + ", tentative: " + tentative + ", mdat: " + mdat;
	}

}
