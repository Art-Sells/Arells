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


	// Comment out bottom getters after successful tests
	
	 @GetMapping("/test") public String test() { return "test/home-test.jsp"; }
	 
	 @GetMapping("/stayupdated-test") public String stayUpdatedTest() { return "test/stayupdated-test.jsp"; }	 
	 
	 @GetMapping("/prototype-seller-created-test") public String prototypeSellerCreatedTest() { return
	 "test/seller-created-test.jsp"; }
	 
	 @GetMapping("/prototype-seller-collected-test") public String prototypeSellerCollectedTest() { return
	 "test/seller-collected-test.jsp"; }
	 
	 @GetMapping("/prototype-buyer-created-test") public String prototypeBuyerCreatedTest() { return
	 "test/buyer-created-test.jsp"; }
	 
	 @GetMapping("/prototype-buyer-collected-test") public String prototypeBuyerCollectedTest() { return
	 "test/buyer-collected-test.jsp"; }

	 @GetMapping("/prototype-cart-test") public String cartTest() { return
	 "test/cart-test.jsp"; }
}
