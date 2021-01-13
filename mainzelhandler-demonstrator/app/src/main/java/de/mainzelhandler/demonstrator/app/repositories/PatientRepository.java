package de.mainzelhandler.demonstrator.app.repositories;

import org.springframework.data.repository.CrudRepository;

import de.mainzelhandler.demonstrator.app.entities.PatientEntity;

public interface PatientRepository extends CrudRepository<PatientEntity, String> {

}
