package com.arells.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/")
public class MainController {

	@GetMapping("")
	public String home() {
		return "home.jsp";
	}
	
	@GetMapping("/stayupdated")
	public String stayUpdated() {
		return "stayupdated.jsp";
	}

//	@GetMapping("/roadmap")
//	public String roadmap() {
//		return "roadmap.jsp";
//	}

	// Comment out bottom getters after successful tests
	
//	 @GetMapping("/test") public String test() { return "test/home-test.jsp"; }
//	 
//	 @GetMapping("/stayupdated-test") public String stayUpdatedTest() { return "test/stayupdated-test.jsp"; }	 
//	 
//	 @GetMapping("/roadmap-test") public String roadmapTest() { return
//	 "test/roadmap-test.jsp"; }
	 

}
