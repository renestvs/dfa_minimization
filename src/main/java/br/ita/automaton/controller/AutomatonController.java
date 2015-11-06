package br.ita.automaton.controller;

import java.io.File;
import java.util.Arrays;
import java.util.LinkedHashSet;

import javax.servlet.ServletContext;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.ModelAndView;

import br.ita.automaton.dfa.DFA;
import br.ita.automaton.dfa.DFAMinimizer;
import br.ita.automaton.model.State;
import br.ita.automaton.model.Transition;
import br.ita.automaton.util.TransitionType;
import br.ita.automaton.visual.GraphViz;
 
@Controller
public class AutomatonController {
	String message = "Welcome to DFA Minization!";
 
	@RequestMapping(value = "/dfa_minimizer",  method = RequestMethod.GET)
	public ModelAndView showMessage(
			@RequestParam(value = "name", required = false, defaultValue = "World") String name) {
		System.out.println("in controller");
 
		ModelAndView mv = new ModelAndView("dfa_minimizer");
		mv.addObject("message", message);
		mv.addObject("name", name);
		return mv;
	}
	
	@Autowired
	private ServletContext servletContext;
	
	@RequestMapping(value = "/results",  method = RequestMethod.POST)
	public ModelAndView dfaMinimization(
			@RequestParam(value = "name", required = false, defaultValue = "World") String name) {

		System.out.println("servletContext.getContextPath(): " + servletContext.getContextPath());
		
		/* dfa minimization */
		DFA automaton;
		GraphViz gv;
		automaton = new DFA();
		
		automaton.setAlphabet(new LinkedHashSet<Character>(Arrays.asList('a', 'b')));
				
		State state0 = new State();
		State state1 = new State();
		State state2 = new State(true);
		State state3 = new State();
		State state4 = new State();
		State state5 = new State();
		State state6 = new State();
		State state7 = new State(true);
		
		new Transition(state0, state1, TransitionType.CHARACTER, 'a');
		new Transition(state0, state4, TransitionType.CHARACTER, 'b');
		
		new Transition(state1, state5, TransitionType.CHARACTER, 'a');
		new Transition(state1, state2, TransitionType.CHARACTER, 'b');
		
		new Transition(state2, state3, TransitionType.CHARACTER, 'a');
		new Transition(state2, state6, TransitionType.CHARACTER, 'b');
		
		new Transition(state3, state3, TransitionType.CHARACTER, 'a');
		new Transition(state3, state3, TransitionType.CHARACTER, 'b');
		
		new Transition(state4, state1, TransitionType.CHARACTER, 'a');
		new Transition(state4, state4, TransitionType.CHARACTER, 'b');
		
		new Transition(state5, state1, TransitionType.CHARACTER, 'a');
		new Transition(state5, state4, TransitionType.CHARACTER, 'b');
		
		new Transition(state6, state3, TransitionType.CHARACTER, 'a');
		new Transition(state6, state7, TransitionType.CHARACTER, 'b');
		
		new Transition(state7, state3, TransitionType.CHARACTER, 'a');
		new Transition(state7, state6, TransitionType.CHARACTER, 'b');
		
		
		automaton.addState(state0);
		automaton.setInitialState(state0);
		automaton.addState(state1);
		automaton.addState(state2);
		automaton.addState(state3);
		automaton.addState(state4);
		automaton.addState(state5);
		automaton.addState(state6);
		automaton.addState(state7);
		
		gv = new GraphViz();
		
		String type = "gif";
		String repesentationType= "dot";
		
		// Visual DFA		
		gv.addln(automaton.toDot());
		gv.increaseDpi();   
		File out = new File(servletContext.getRealPath("/") + "/resources/img/dfa." + type);
		gv.writeGraphToFile(gv.getGraph(gv.getDotSource(), type, repesentationType), out);
		gv.clearGraph();
		
		DFA minimized = DFAMinimizer.minimize(automaton);
		
		// Visual DFA Minimized
		gv.addln(minimized.toDot());
		out = new File(servletContext.getRealPath("/") + "/resources/img/minimized-dfa." + type); 
		gv.writeGraphToFile(gv.getGraph(gv.getDotSource(), type, repesentationType), out);
		/* dfa minimization */
 
		System.out.println("SC: " + servletContext.getRealPath("resources/img/ITA_logo.jpg"));
		
		ModelAndView mv = new ModelAndView("results");
		return mv;
	}
	
}