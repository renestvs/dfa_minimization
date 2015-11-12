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
		boolean state = true;
		boolean endState = false;
		boolean addStates = false;
		boolean setTransitions = false;
	    String alphabet [] = new String [1000];
		
		for (String string : lines) {
			
			//3rd setTransitions
			if(setTransitions){
				if(string.length()!=0){
					logger.info("setTransitions: " + string);
				}else{
					setTransitions = false;
					logger.info("end");
				}
			}
			
			//2nd set endStates
			if(endState){
				if(string.length()!=0){
					logger.info("endstate: " + string);
				}else{
					endState = false;
					setTransitions = true;
					//TODO addStates here
				}
			}
			
			//1st set states
			if (state){
				if(string.length()!=0){
					logger.info("state: " + string);
				}else{
					state = false;
					endState = true;
				}
			}
			
		}
						
		State state0 = new State();
		state0.setNumber("11");
		State state1 = new State();
		state1.setNumber("22");
		State state2 = new State();
		state2.setNumber("33");
		State state3 = new State();
		state3.setNumber("44");
		State state4 = new State();
		state4.setNumber("55");
		State state5 = new State();
		state5.setNumber("66");
		State state6 = new State();
		state6.setNumber("77");
		State state7 = new State();
		state7.setNumber("88");
		
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
		
		//set end states
		state2.setAccept(true);
		state7.setAccept(true);
		
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
