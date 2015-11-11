package br.ita.automaton.controller;

import javax.servlet.ServletContext;

import org.apache.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.ModelAndView;

import br.ita.automaton.core.dfa.DFAMinimizer;
import br.ita.automaton.service.DFAService;


@Controller
public class DFAController {
 
	private static Logger logger = Logger.getLogger(DFAController.class);

	@Autowired
	private ServletContext servletContext;
	
	private DFAService DFA; 
	
	@RequestMapping(value = "/dfa_minimizer",  method = RequestMethod.GET)
	public ModelAndView showMessage() {
		ModelAndView mv = new ModelAndView("dfa_minimizer");
		return mv;
	}
	
	@RequestMapping(value = "/dfa_minimizer/results",  method = RequestMethod.POST)
	public ModelAndView dfaMinimization(
			@RequestParam(value = "name", required = false, defaultValue = "World") String name) {

		getDFA().DFAMinimizer(servletContext.getRealPath("/"));
		logger.info("DFA PATH: " + getDFA().getDFAPath()); 
		logger.info("MINIMIZED PATH: " + getDFA().getDFAminizedPath());
		
		ModelAndView mv = new ModelAndView("dfa_minimizer_results");
		mv.addObject("dfa", getDFA().getDFAPath());
 		mv.addObject("minimized", getDFA().getDFAminizedPath());
 		return mv;
	}

	public DFAService getDFA() {
		if (DFA == null){
			DFA = new DFAService();
		}
		return DFA;
	}

	public void setDFA(DFAService DFA) {
		this.DFA = DFA;
	}
	
}