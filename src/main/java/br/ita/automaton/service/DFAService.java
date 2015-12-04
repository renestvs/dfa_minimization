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
        
        public static final String FILE_LINE_SEPARATOR = "\r\n"; //Could be System.getProperty("line.separator"), but there are problems in Linux;
	
	public DFAService (){
		
	}
	
	DFA validDfa = new DFA();
	LinkedHashSet<State> reachableDfaStates = new LinkedHashSet<State>();	
	public void setUnreachableStates(State state) {
		if(state.isVisited()) {
			return;
		}
		state.setVisited(true);
		reachableDfaStates.add(state);
		
		try {
			validDfa.addState(state);
		} catch(RuntimeException e) {
			logger.debug("Estado Já Existente!");
		}
		
		for (Transition transition : state.getOutgoing()) {
			
			logger.debug("Atual: " + state.getNumber());
			logger.debug("Simbolo: " + transition.getCharacter());
			logger.debug("Proximo: " + transition.getTo().getNumber());
			logger.debug("\n");

			transition.getTo().setReachable(true);
			
			setUnreachableStates(transition.getTo());
		}
	}
	
	
	public boolean DFAMinimizer (String path, String stringDFA){
		
		DFA dfa = createDFA(stringDFA);	
		setUnreachableStates(dfa.getInitialState());
		if (visualDFA(validDfa, path, "dfa")){
			setDFAPath("dfa");
		}
	
		DFA minimized = DFAMinimizer.minimize(validDfa);
		if(visualDFA(minimized, path, "dfa-minimized")){
			setDFAMinimizedPath("dfa-minimized");
		}
		
		return true;
	}

	public DFA createDFA(String dfa) {
		logger.debug("criarDFA (start");
		
		this.automaton = new DFA();
		
		Map<String, State> automatonSetStateMapping = new HashMap<String, State>();
		
		LinkedList<State> DFAStates = new LinkedList<State>();
		LinkedHashSet<Character> DFAAlphabet = new LinkedHashSet<Character>();
		
		// cada elemento do vetor armazena uma linha da string
		String[] lines = dfa.split(FILE_LINE_SEPARATOR);
		
		boolean initial = true;
		boolean state = true;
		
		boolean endState = false;
		boolean setTransitions = false;
	    
	    
		for (String line : lines) {
			logger.info("line: " + line);
			
			//3rd set Transitions
			if(setTransitions){
				if(line.length()!=0){
					
					String[] DFATransitionMapping = line.split(" ");
					
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
				if(line.length()!=0){
					
					State DFAstate = new DFAState();
					DFAstate.setNumber(line);
					DFAstate.setAccept(true);
					automatonSetStateMapping.put(line, DFAstate);
					State DFAState = automatonSetStateMapping.get(line);
					DFAStates.addLast(DFAState);

				}else{
					endState = false;
					setTransitions = true;
				}
			}
			
			//1st set states
			if (state){
				if(line.length()!=0){					
					State DFAstate = new DFAState();
					DFAstate.setNumber(line);
					
					automatonSetStateMapping.put(line, DFAstate);
					State DFAState = automatonSetStateMapping.get(line);
		
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
			    
			    validDfa.addState(DFAState);
			    validDfa.setInitialState(DFAState);
			    first = false;
			} else {
				this.automaton.addState(DFAState);
			}
		}
		
		//set alphabet
	    this.automaton.setAlphabet(DFAAlphabet);
	    validDfa.setAlphabet(DFAAlphabet);

		logger.debug("criarDFA (end");
		
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
