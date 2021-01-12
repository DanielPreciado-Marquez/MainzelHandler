package de.mainzelhandler.backend.core.interfaces;

import java.util.List;
import java.util.Map;

import de.mainzelhandler.backend.core.model.Patient;

/**
 * Interface for the patient resource.
 */
public interface PatientInterface {

	/**
	 * REST interface for incoming patients. Has to be available at
	 * '/patients/send'.
	 *
	 * @param patients List of patients to be processed on the server.
	 * @return Response whether the processing was successful. Key is the id of the
	 *         patient and value is true, if the patient got processed successfully.
	 */
	Map<String, Boolean> acceptPatientsRequest(final List<Patient> patients);

	/**
	 * REST interface for the callback request of the Mainzelliste. Has to be
	 * available at '/patients/send/pseudonyms'.
	 *
	 * @param requestBody Body of the request. See Mainzelliste documentation for
	 *                    more informations.
	 */
	void acceptPatientsPseudonymsRequest(final String requestBody);

	/**
	 * EST interface for incoming id's of patients to be returned. Has to be
	 * available at '/patients/request'. Id's are either pseudonyms or tokens used
	 * for the pseudonymization.
	 *
	 * @param ids Ids of the patients.
	 * @return List of found patients.
	 */
	List<Patient> requestPatientsRequest(List<String> ids);

}
