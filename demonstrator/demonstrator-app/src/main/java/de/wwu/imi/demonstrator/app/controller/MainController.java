package de.wwu.imi.demonstrator.app.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Main Controller that renders our *beautiful* UI.
 */
@Controller
@CrossOrigin
public class MainController {

	@GetMapping("/")
	public String welcome(Model model) {
		return "welcome"; // welcome.html in src/main/resources/templates/
	}

	@GetMapping("/sendPatients")
	public String sendPatients(Model model) {
		return "sendPatients";
	}

	@GetMapping("/requestPatients")
	public String requestPatients(Model model) {
		return "requestPatients";
	}

	// Test sites
	@GetMapping("/utilTest")
	public String utilTest(Model model) {
		return "utilTest";
	}

	@GetMapping("/integrationTest")
	public String integrationTest(Model model) {
		return "integrationTest";
	}

	@GetMapping("/batchTest")
	public String batchTest(Model model) {
		return "batchTest";
	}
}
