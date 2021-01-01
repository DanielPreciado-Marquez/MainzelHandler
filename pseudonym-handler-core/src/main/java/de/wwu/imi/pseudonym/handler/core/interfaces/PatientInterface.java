package de.wwu.imi.pseudonym.handler.core.interfaces;

import java.util.List;
import java.util.Map;

import de.wwu.imi.pseudonym.handler.core.model.Patient;

public interface PatientInterface {

	Map<String, Boolean> acceptPatientsRequest(final List<Patient> patients);

	void acceptPatientsPseudonymsRequest(final String requestBody);

	List<Patient> requestPatientsRequest(List<String> ids);

}
