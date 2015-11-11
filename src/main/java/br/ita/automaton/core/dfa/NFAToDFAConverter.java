package br.ita.automaton.core.dfa;

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

import br.ita.automaton.core.nfa.NFA;
import br.ita.automaton.model.*;
import br.ita.automaton.util.TransitionType;

public class NFAToDFAConverter {
		
		
	public static DFA convert(NFA nfaAutomaton) {				
		Map<State, Set<State>> epsClosure = buildEpsClosure(nfaAutomaton);
		
		DFA dfaAutomaton = new DFA();
		dfaAutomaton.setAlphabet(nfaAutomaton.getAlphabet());
		DFAState initialDfaState = new DFAState(epsClosure.get(nfaAutomaton.getInitialState()));
		dfaAutomaton.addState(initialDfaState);
		dfaAutomaton.setInitialState(initialDfaState);
				
		buildState(initialDfaState, dfaAutomaton, nfaAutomaton, epsClosure);
		
		return dfaAutomaton;
	}

	
	private static Map<State, Set<State>> buildEpsClosure(NFA nfaAutomaton) {
		Map<State, Set<State>> epsClosure = new LinkedHashMap<State, Set<State>>();
		
		for(State state : nfaAutomaton.getStates()) {
			Set<State> states = new LinkedHashSet<State>();
			states.add(state);
			
			epsClosure.put(state, states);
		}
		
		boolean changed = true;
		
		while(changed) {
			changed = false;
			
			for(State fromState : nfaAutomaton.getStates()) {
				Set<State> stateEpsClosure = null;
				
				for(State toState : nfaAutomaton.getEpsilonStates(fromState)) {
					if(stateEpsClosure == null) {
						stateEpsClosure = epsClosure.get(fromState);
					}
					
					Set<State> toStateEpsClosure = epsClosure.get(toState);
					
					if(!stateEpsClosure.containsAll(toStateEpsClosure)) {
						stateEpsClosure.addAll(toStateEpsClosure);
						
						changed = true;
					}
				}
			}
		}
		
		return epsClosure;
	}
	
	
	private static void buildState(DFAState dfaState, DFA dfaAutomaton, 
			NFA nfaAutomaton, Map<State, Set<State>> epsClosure) {
		
		for(State nfaState : dfaState.getNfaStates()) {
			if(nfaAutomaton.getFinalStates().contains(nfaState)) {
				dfaState.setAccept(true);
				if(!dfaAutomaton.getStates().contains(dfaState))
					dfaAutomaton.addState(dfaState);
				break;
			}
		}
		
		for(Character c : nfaAutomaton.getAlphabet()) {
			Set<State> nfaStates = new LinkedHashSet<State>();
			
			for(State state : dfaState.getNfaStates()) {
				for(State toState : nfaAutomaton.getStates(state, c)) {
					nfaStates.addAll(epsClosure.get(toState));
				}
			}
			
			if(!nfaStates.isEmpty()) {
				DFAState newDfaState = null;
				
				for(State existingState : dfaAutomaton.getStates()) {
					DFAState existingDfaState = (DFAState)existingState;
					
					if(existingDfaState.getNfaStates().equals(nfaStates)) {
						newDfaState = existingDfaState;
						break;
					}
				}
				
				boolean newState = false;
				
				if(newDfaState == null) {
					newDfaState = new DFAState(nfaStates);
					newState = true;
				}
				
				new Transition(dfaState, newDfaState, TransitionType.CHARACTER, c);
				
				if(newState) {
					dfaAutomaton.addState(newDfaState);
					
					buildState(newDfaState, dfaAutomaton, nfaAutomaton, epsClosure);
				}
			}			
		}
	}

}