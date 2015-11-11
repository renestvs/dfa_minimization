package br.ita.automaton.service;

import java.io.File;
import java.util.Arrays;
import java.util.LinkedHashSet;

import org.apache.log4j.Logger;

import br.ita.automaton.controller.DFAController;
import br.ita.automaton.core.dfa.DFA;
import br.ita.automaton.core.dfa.DFAMinimizer;
import br.ita.automaton.model.State;
import br.ita.automaton.model.Transition;
import br.ita.automaton.util.TransitionType;
import br.ita.automaton.visual.GraphViz;

public class DFAService {
	
	private DFA automaton;
	private GraphViz automatonVisual = new GraphViz();;
	private String type = "jpg";
	private String repesentationType= "dot";
	
	private String DFAPath;
	private String DFAminizedPath;
	
	private static Logger logger = Logger.getLogger(DFAController.class);
	
	public DFAService (){
		
	}
	
	public boolean DFAMinimizer (String path, String dfa){
		
		mountingDFA(dfa);
		
		if (visualDFA(automaton, path, "DFA")){
			setDFAPath("DFA");
		}
		DFA minimized = DFAMinimizer.minimize(automaton);

		if(visualDFA(minimized, path, "DFAminimized")){
			setDFAminizedPath("DFAminimized");
		}
		
		return true;
	}

	public DFA mountingDFA(String dfa) {
		
		this.automaton = new DFA();
		
		String[] lines = dfa.split(System.getProperty("line.separator"));
		for (String string : lines) {
			logger.info("new 2:" + string);
		}
		logger.info(lines);
				
		//set states
		State state0 = new State();
		State state1 = new State();
		State state2 = new State();
		State state3 = new State();
		State state4 = new State();
		State state5 = new State();
		State state6 = new State();
		State state7 = new State();
		
		//set end states
		state2.setAccept(true);
		state7.setAccept(true);
		
		//add states
		automaton.addState(state0);
		automaton.setInitialState(state0);
		automaton.addState(state1);
		automaton.addState(state2);
		automaton.addState(state3);
		automaton.addState(state4);
		automaton.addState(state5);
		automaton.addState(state6);
		automaton.addState(state7);
		
		//set transitions
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
		
		//set alphabet
	    automaton.setAlphabet(new LinkedHashSet<Character>(Arrays.asList('a', 'b')));
		
		return this.automaton;
	}

	private boolean visualDFA(DFA automaton, String path, String filename) {
		// Visual DFA		
		automatonVisual.addln(automaton.toDot());
		automatonVisual.increaseDpi();   
		automatonVisual.writeGraphToFile(automatonVisual.getGraph(
				automatonVisual.getDotSource(), type, repesentationType), 
				filePath(path, filename));
		automatonVisual.clearGraph();
		return true;
	}

	private File filePath(String path, String filename) {
		File out = new File(path, "/resources/img/" + filename + "." + type);
		return out;
	}
	
	public String getDFAPath() {
		return DFAPath;
	}

	public void setDFAPath(String filename) {
		this.DFAPath = "/automaton/resources/img/" + filename + "." + type;
	}

	public String getDFAminizedPath() {
		return DFAminizedPath;
	}

	public void setDFAminizedPath(String filename) {
		DFAminizedPath = "/automaton/resources/img/" + filename + "." + type;
	}


	
}
