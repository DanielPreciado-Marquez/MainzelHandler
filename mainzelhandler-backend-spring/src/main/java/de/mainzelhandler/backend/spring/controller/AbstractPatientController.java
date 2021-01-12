package de.mainzelhandler.backend.spring.controller;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

import de.mainzelhandler.backend.core.exceptions.MainzellisteConnectionException;
import de.mainzelhandler.backend.core.exceptions.MainzellisteRuntimeException;
import de.mainzelhandler.backend.core.interfaces.PatientInterface;
import de.mainzelhandler.backend.core.model.Patient;
import de.mainzelhandler.backend.spring.services.PseudonymManagerSpring;

/**
 * REST interface for the patient resource.
 */
@RequestMapping("${mainzelhandler.request-path:}/patients")
public abstract class AbstractPatientController implements PatientInterface {

	private static final Logger LOGGER = org.slf4j.LoggerFactory.getLogger(AbstractPatientController.class);

	/**
	 * Specifies whether the callback function of the Mainzelliste should be used.
	 */
	@Value("${mainzelhandler.useCallback:false}")
	private boolean useCallback;

	/**
	 * PseudonymManager.
	 */
	@Autowired
	private PseudonymManagerSpring pseudonymManager;

	/**
	 * Accepts a list of patients to be handled by the application. If the callback
	 * function is active, the pseudonym of the patient has to be replaced with the
	 * token used for the pseudonymization.
	 *
	 * @param patients List of patients.
	 * @return Key-value-pairs. The Key is either the pseudonym if
	 *         {@link #useCallback} is false or the token if {@link #useCallback} is
	 *         true. The value indicates whether the corresponding patient got
	 *         handled by the application.
	 */
	@PostMapping("/send")
	public final Map<String, Boolean> acceptPatientsRequest(@RequestBody final List<Patient> patients) {
		LOGGER.info("Recieved " + patients.size() + " patients");
		return pseudonymManager.processPatients(patients, this::acceptPatients, useCallback);
	}

	/**
	 * Accepts the callback request from the Mainzelliste. Saves the containing
	 * token and pseudonym with the pseudonymManager.
	 *
	 * @param requestBody Token and pseudonym of the pseudonymization.
	 */
	@PostMapping("/send/pseudonyms")
	public final void acceptPatientsPseudonymsRequest(@RequestBody final String requestBody) {
		LOGGER.info("Recieved pseudonym from mainzelliste: " + requestBody);
		pseudonymManager.putPseudonym(requestBody);
	}

	/**
	 * Request the MDAT of the given patients. Returns the patients found by the
	 * application. The id's are either the patients pseudonyms if
	 * {@link #useCallback} is false or the token used for the pseudonymization if
	 * {@link #useCallback} is true. The value of {@link #useCallback} gets send to
	 * the client with the request of the tokens.
	 *
	 * @param ids List containing id's of the requested patients. An id is either a
	 *            pseudonym or the token used for the pseudonymization.
	 * @return Map containing the id's and the corresponding MDAT.
	 */
	@PostMapping("/request")
	public final List<Patient> requestPatientsRequest(@RequestBody List<String> ids) {
		LOGGER.info("Requesting " + ids.size() + " patients");
		return pseudonymManager.processRequest(ids, this::requestPatients, useCallback);
	}

	@ExceptionHandler({ MainzellisteRuntimeException.class, MainzellisteConnectionException.class })
	public final ResponseEntity<Object> handlePseudonymizationServerException(final Exception exception) {
		return new ResponseEntity<>(exception.getMessage(), HttpStatus.SERVICE_UNAVAILABLE);
	}

	/**
	 * Abstract method to be implemented by the application. Accepts a list of
	 * patients to get handled by the application. Returns an indicator, whether the
	 * handling was successful.
	 *
	 * @param patients List of patients.
	 * @return Map containing the pseudonym of the patients and a boolean that
	 *         indicates if the patients got processed successfully.
	 */
	public abstract Map<String, Boolean> acceptPatients(final List<Patient> patients);

	/**
	 * Abstract method to be implemented by the application. Takes a List of
	 * pseudonyms and returns the corresponding patient.
	 *
	 * @param pseudonyms List of pseudonyms.
	 * @return List containing the requested patients.
	 */
	public abstract List<Patient> requestPatients(final List<String> pseudonyms);

}
