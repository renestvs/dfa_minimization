package br.ita.automaton.service;

import java.io.File;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashSet;
import java.util.LinkedList;
import java.util.Map;
import java.util.Set;

import org.apache.log4j.Logger;

import br.ita.automaton.controller.DFAController;
import br.ita.automaton.core.dfa.DFA;
import br.ita.automaton.core.dfa.DFAMinimizer;
import br.ita.automaton.core.dfa.DFAState;
import br.ita.automaton.model.State;
import br.ita.automaton.model.Transition;
import br.ita.automaton.util.TransitionType;
import br.ita.automaton.visual.GraphViz;

public class DFAService {
	
	private DFA automaton;
	private GraphViz automatonVisual = new GraphViz();;
	private String type = "jpg";
	private String representationType = "dot";
	
	private String DFAPath;
	private String DFAMinimizedPath;
	
	private static Logger logger = Logger.getLogger(DFAController.class);
	
	public DFAService (){
		
	}
	
	public boolean DFAMinimizer (String path, String dfa){
		
		createDFA(dfa);
		
		if (visualDFA(automaton, path, "DFA")){
			setDFAPath("DFA");
		}
		DFA minimized = DFAMinimizer.minimize(automaton);

		if(visualDFA(minimized, path, "DFAminimized")){
			setDFAMinimizedPath("DFAminimized");
		}
		
		return true;
	}

	public DFA createDFA(String dfa) {
		
		this.automaton = new DFA();
		
		Map<String, State> automatonSetStateMapping = new HashMap<String, State>();
		
		LinkedList<State> DFAStates = new LinkedList<State>();
		LinkedHashSet<Character> DFAAlphabet = new LinkedHashSet<Character>();
		
		String[] lines = dfa.split(System.getProperty("line.separator"));
		
		boolean state = true;
		boolean endState = false;
		boolean setTransitions = false;
	    
	    boolean initial = true;
		
		for (String string : lines) {
			logger.info("String: " + string);
			
			//3rd set Transitions
			if(setTransitions){
				if(string.length()!=0){
					
					String[] DFATransitionMapping = string.split(" ");
					
					State DFAState = automatonSetStateMapping.get(DFATransitionMapping[0]);
					State DFAToState = automatonSetStateMapping.get(DFATransitionMapping[2]);
					
					new Transition(DFAState, DFAToState, TransitionType.CHARACTER, DFATransitionMapping[1].charAt(0));
					
					boolean repeat = false;
					
					for (Iterator iterator = DFAAlphabet.iterator(); iterator.hasNext();) {
						Character character = (Character) iterator.next();
						if (character.equals(DFATransitionMapping[1].charAt(0))){
							repeat = true;
						}
					}
					
					if (!repeat){
						DFAAlphabet.add(DFATransitionMapping[1].charAt(0));
						logger.info("Add char: " + DFATransitionMapping[1].charAt(0));
					}

				}else{
					setTransitions = false;
					logger.info("end");
				}
			}
			
			//2nd set endStates
			if(endState){
				if(string.length()!=0){
					
					State DFAstate = new DFAState();
					DFAstate.setNumber(string);
					DFAstate.setAccept(true);
					automatonSetStateMapping.put(string, DFAstate);
					State DFAState = automatonSetStateMapping.get(string);
					DFAStates.addLast(DFAState);

				}else{
					endState = false;
					setTransitions = true;
				}
			}
			
			//1st set states
			if (state){
				if(string.length()!=0){
					
					State DFAstate = new DFAState();
					DFAstate.setNumber(string);
					automatonSetStateMapping.put(string, DFAstate);
					State DFAState = automatonSetStateMapping.get(string);
		
					if (initial) {
						DFAStates.addFirst(DFAState);
						initial = false;
					} else {
						DFAStates.addLast(DFAState);
					}
				}else{
					state = false;
					endState = true;
				}
			}
			
		}
		
		boolean first = true;
		for (State DFAState : DFAStates) {
			if (first) {				
			    this.automaton.addState(DFAState);
			    this.automaton.setInitialState(DFAState);
				first = false;
			} else {
				this.automaton.addState(DFAState);
			}
		}
		
		//set alphabet
	    this.automaton.setAlphabet(DFAAlphabet);
		
		return this.automaton;
	}

	private boolean visualDFA(DFA automaton, String path, String filename) {
		// Visual DFA		
		automatonVisual.addln(automaton.toDot());
		automatonVisual.increaseDpi();   
		automatonVisual.writeGraphToFile(automatonVisual.getGraph(
				automatonVisual.getDotSource(), type, representationType), 
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

	public String getDFAMinimizedPath() {
		return DFAMinimizedPath;
	}

	public void setDFAMinimizedPath(String filename) {
		DFAMinimizedPath = "/automaton/resources/img/" + filename + "." + type;
	}


	
}
