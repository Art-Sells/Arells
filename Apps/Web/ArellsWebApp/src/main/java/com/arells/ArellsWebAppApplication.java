package com.arells;

import org.apache.catalina.connector.Connector;
import org.apache.coyote.ajp.AbstractAjpProtocol;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.web.servlet.error.ErrorViewResolver;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.ModelAndView;

import com.arells.ArellsWebAppApplication;

@SpringBootApplication
public class ArellsWebAppApplication {

	public static void main(String[] args) {
		SpringApplication.run(ArellsWebAppApplication.class, args);
	}
	@Bean
    public TomcatServletWebServerFactory servletContainer() {
        TomcatServletWebServerFactory tomcat = new TomcatServletWebServerFactory();
        Connector ajpConnector = new Connector("AJP/1.3");
        ajpConnector.setPort(9090);
        ajpConnector.setSecure(false);
        ajpConnector.setAllowTrace(false);
        ajpConnector.setScheme("http");
        ((AbstractAjpProtocol<?>)ajpConnector.getProtocolHandler()).setSecretRequired(false);
        tomcat.addAdditionalTomcatConnectors(ajpConnector);
        return tomcat;
        }
	@Bean
	public ErrorViewResolver customErrorViewResolver() {
	    return (request, status, model) -> {
	        ModelAndView modelAndView = new ModelAndView();
	        modelAndView.setViewName("error.html");
	        return modelAndView;
	    };
	}

}
