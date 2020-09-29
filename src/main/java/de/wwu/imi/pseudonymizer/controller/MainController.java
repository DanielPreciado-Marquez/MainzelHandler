package de.wwu.imi.pseudonymizer.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
@CrossOrigin
public class MainController {
    @GetMapping("/")
    public String pseudonymize(Model model) {
        return "welcome";
    }
}
