package de.wwu.imi.demonstrator.app.controller;

import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RestController;

import de.wwu.imi.demonstrator.app.entities.PatientEntity;
import de.wwu.imi.demonstrator.app.repositories.PatientRepository;
import de.wwu.imi.pseudonymizer.lib.controller.AbstractPseudonymizationController;
import de.wwu.imi.pseudonymizer.lib.model.Patient;

@RestController
@CrossOrigin
public class PatientController extends AbstractPseudonymizationController {

	private static final Logger LOGGER = org.slf4j.LoggerFactory.getLogger(PatientController.class);

	@Autowired
	private PatientRepository patientRepository;

	@Override
	public List<Boolean> acceptPatients(List<Patient> patients) {
		LOGGER.debug("Storing " + patients.size() + " patients");

		final List<Boolean> success = new ArrayList<Boolean>(patients.size());

		for (final var patient : patients) {
			LOGGER.debug("Storing Patient: " + patient.toString());

			final var patientEntity = new PatientEntity(patient);
			patientRepository.save(patientEntity);

			success.add(true);
		}
		LOGGER.debug("Storing completed");

		return success;
	}

	@Override
	public List<Patient> requestPatients(List<String> pseudonyms) {
		LOGGER.debug("Requesting " + pseudonyms.size() + " patients");

		final var patients = new ArrayList<Patient>(pseudonyms.size());

		for (final String pseudonym : pseudonyms) {
			LOGGER.debug("Searching: " + pseudonym);

			final var patientEntity = patientRepository.findById(pseudonym);

			if (patientEntity.isPresent()) {
				patients.add(new Patient(pseudonym, patientEntity.get().getMdat()));
			} else {
				patients.add(new Patient(pseudonym, "{}"));
			}
		}
		LOGGER.debug("Request resolved");

		return patients;
	}

}
