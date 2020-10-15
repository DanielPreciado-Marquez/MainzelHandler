package de.wwu.imi.pseudonymizer.lib.entities;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

@Entity
@Table(name = "patient")
public class Patient {

	@Id
	@Column(name = "pseudonym")
	private String pseudonym;

	@Column(name = "mdat")
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

	@Override
	public String toString() {
		return "pseudonym: " + pseudonym + ", mdat: " + mdat;
	}

}
