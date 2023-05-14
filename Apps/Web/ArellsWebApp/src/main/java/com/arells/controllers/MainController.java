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
		return "homer.jsp";
	}
	
	@GetMapping("/stayupdated")
	public String stayUpdated() {
		return "stayupdated.jsp";
	}
	 
	 // Prototype
	 @GetMapping("/prototype-seller-created") public String prototypeSellerCreated() { return
	 "prototype/seller-created.jsp"; }
	 
	 @GetMapping("/prototype-seller-collected") public String prototypeSellerCollected() { return
	 "prototype/seller-collected.jsp"; }
	 
	 @GetMapping("/prototype-buyer-created") public String prototypeBuyerCreated() { return
	 "prototype/buyer-created.jsp"; }
	 
	 @GetMapping("/prototype-buyer-collected") public String prototypeBuyerCollected() { return
	 "prototype/buyer-collected.jsp"; }
	 
	 
	 
	 //Images
	 @GetMapping("/prototype-blue-orange") public String prototypeBlueOrange() { return
	 "prototype/images/blue-orange.jsp"; }
	 
	 @GetMapping("/prototype-beach-houses") public String prototypeBeachHouse() { return
	 "prototype/images/beach-houses.jsp"; }
	 
	 @GetMapping("/prototype-colour-glass") public String prototypeColourGlass() { return
	 "prototype/images/colour-glass.jsp"; }
	 
	 @GetMapping("/prototype-layers") public String prototypeLayers() { return
	 "prototype/images/layers.jsp"; }	 
	 
	 @GetMapping("/prototype-succinct-drop") public String prototypeSuccinctDrop() { return
	 "prototype/images/succinct-drop.jsp"; }
	 
	 @GetMapping("/prototype-paint-rain") public String prototypePaintRain() { return
	 "prototype/images/paint-rain.jsp"; }	
	 
	 
	 
	 
	 // Cart
	 @GetMapping("/prototype-cart") public String cart() { return
	 "prototype/cart/cart.jsp"; }
	 


	// Comment out bottom getters after successful tests
	
//	 @GetMapping("/test") public String test() { return "test/home-test.jsp"; }
//	 
//	 @GetMapping("/stayupdated-test") public String stayUpdatedTest() { return "test/stayupdated-test.jsp"; }	 
//	 
//	 
//	 // Prototype Test
//	 @GetMapping("/prototype-seller-created-test") public String prototypeSellerCreatedTest() { return
//	 "test/prototype/seller-created-test.jsp"; }
//	 
//	 @GetMapping("/prototype-seller-collected-test") public String prototypeSellerCollectedTest() { return
//	 "test/prototype/seller-collected-test.jsp"; }
//	 
//	 @GetMapping("/prototype-buyer-created-test") public String prototypeBuyerCreatedTest() { return
//	 "test/prototype/buyer-created-test.jsp"; }
//	 
//	 @GetMapping("/prototype-buyer-collected-test") public String prototypeBuyerCollectedTest() { return
//	 "test/prototype/buyer-collected-test.jsp"; }
//	 
//	 
//	 
//	 //Images Test
//	 @GetMapping("/prototype-blue-orange-test") public String prototypeBlueOrangeTest() { return
//	 "test/prototype/images/blue-orange-test.jsp"; }
//	 
//	 @GetMapping("/prototype-beach-houses-test") public String prototypeBeachHousesTest() { return
//	 "test/prototype/images/beach-houses-test.jsp"; }
//	 
//	 @GetMapping("/prototype-colour-glass-test") public String prototypeColourGlassTest() { return
//	 "test/prototype/images/colour-glass-test.jsp"; }
//	 
//	 @GetMapping("/prototype-layers-test") public String prototypeLayersTest() { return
//	 "test/prototype/images/layers-test.jsp"; }	 
//	 
//	 @GetMapping("/prototype-succinct-drop-test") public String prototypeSuccinctDropTest() { return
//	 "test/prototype/images/succinct-drop-test.jsp"; }
//	 
//	 @GetMapping("/prototype-paint-rain-test") public String prototypePaintRainTest() { return
//	 "test/prototype/images/paint-rain-test.jsp"; }	
//	 
//	 
//	 
//	 
//	 // Cart Test
//	 @GetMapping("/prototype-cart-test") public String cartTest() { return
//	 "test/prototype/cart/cart-test.jsp"; }
	 
}
