package br.ita.automaton.util;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import br.ita.automaton.core.nfa.NFA;
import br.ita.automaton.model.*;

/**
 * Converts from input automaton to NFA that allows errors.
 *  
 *
 */
public class ApproximateAutomatonConverter {
	
	
	/**
	 * Convert automaton to nfa that allowes errors
	 * 
	 * @param automaton finite state automaton
	 * 
	 * @param errors number of errors allowed. Must be between 0 and nr of automaton states.
	 * @return
	 */
	public static Automaton convert(Automaton automaton, int errors) {
		if(errors < 0) {
			throw new IllegalArgumentException("Allowed error count can not be negative!");
		}
		else if(errors >= automaton.getStates().size()) {
			throw new IllegalArgumentException("Allowed error count can't exeed the number of automaton states!");
		}
				
		Automaton resultAutomaton = new NFA();
		resultAutomaton.setAlphabet(automaton.getAlphabet());
				
		Set<State> states = automaton.getStates();
		
		for(int k = 0; k <= errors; k++) {
			states = buildRow(k, automaton, resultAutomaton, states);
		}
		
		return resultAutomaton;
	}
	
	
	
	private static Set<State> buildRow(int row, Automaton automaton, Automaton resultAutomaton, Set<State> states) {
		Map<State, State> stateMapping = createStateMapping(states);
		
		Set<State> newStates = new LinkedHashSet<State>(states.size());
		
		for(Map.Entry<State, State> stateEntry: stateMapping.entrySet()) {
			State state = stateEntry.getKey();
			State newState = stateEntry.getValue();
			
			createTransitions(state, newState, stateMapping, row, resultAutomaton.getAlphabet());
			
			resultAutomaton.addState(newState);
						
			if(row == 0) {
				if(automaton.getInitialState().equals(state)) {
					resultAutomaton.setInitialState(newState);
				}
			}
			
			newStates.add(newState);
		}
		
		return newStates;
	}
	
	
	
	private static Map<State, State> createStateMapping(Set<State> states) {
		Map<State, State> stateMapping = new LinkedHashMap<State, State>();
		
		for(State state : states) {
			State newState = new State();
			newState.setNumber(state.getNumber());
			newState.setAccept(state.isAccept());
			
			stateMapping.put(state, newState);
		}
		
		return stateMapping;
	}
	
	
	
	private static void createTransitions(State state, State newState, 
			Map<State, State> stateMapping, int row, Set<Character> alphabet) {
		
		List<Transition> transitions = new ArrayList<Transition>(state.getOutgoing());
		
		for(Transition transition : transitions) {
			State toState = transition.getTo();
			State newToState = stateMapping.get(toState);
			
			new Transition(newState, newToState, transition.getType(), transition.getCharacter());
			
			if(row > 0 && !transition.isEpsilon()) {
				// deletion
				new Transition(state, newToState, TransitionType.EPSILON);
				
				// substitution
				new Transition(state, newToState, TransitionType.ALPHABET);
			}
		}
		
		if(row > 0) {
			// insertion
				new Transition(state, newState, TransitionType.ALPHABET);
		}
	}

}
