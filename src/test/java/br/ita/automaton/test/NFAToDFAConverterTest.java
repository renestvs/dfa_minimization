package br.ita.automaton.test;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import org.junit.Before;
import org.junit.Test;

import br.ita.automaton.core.dfa.*;
import br.ita.automaton.core.nfa.NFA;
import br.ita.automaton.model.*;
import br.ita.automaton.util.TransitionType;

import static org.junit.Assert.*;

public class NFAToDFAConverterTest {
	
	private NFA nfaAutomaton;
	
	private State state0;
	private State state1;
	private State state2;
	private State state3;
	private State state4;
	private State state5;
	private State state6;
	private State state7;
	private State state8;
	private State state9;
	private State state10;
	private State state11;
	private State state12;
	private State state13;
	private State state14;
	private State state15;
	private State state16;
	private State state17;
	
	
	@Before
	public void setUp() {
		nfaAutomaton = new NFA();
		
		nfaAutomaton.setAlphabet(new LinkedHashSet<Character>(Arrays.asList('a', 'g', 't')));
		
		state0 = new State();
		state1 = new State();
		state2 = new State();
		state3 = new State();
		state4 = new State();
		state5 = new State();
		state6 = new State();
		state7 = new State();
		state8 = new State();
		state9 = new State();
		state10 = new State();
		state11 = new State();
		state12 = new State();
		state13 = new State();
		state14 = new State();
		state15 = new State();
		state16 = new State();
		state17 = new State(true);
		
		nfaAutomaton.addState(state0);
		nfaAutomaton.setInitialState(state0);
		nfaAutomaton.addState(state1);
		nfaAutomaton.addState(state2);
		nfaAutomaton.addState(state3);
		nfaAutomaton.addState(state4);
		nfaAutomaton.addState(state5);
		nfaAutomaton.addState(state6);
		nfaAutomaton.addState(state7);
		nfaAutomaton.addState(state8);
		nfaAutomaton.addState(state9);
		nfaAutomaton.addState(state10);
		nfaAutomaton.addState(state11);
		nfaAutomaton.addState(state12);
		nfaAutomaton.addState(state13);
		nfaAutomaton.addState(state14);
		nfaAutomaton.addState(state15);
		nfaAutomaton.addState(state16);
		nfaAutomaton.addState(state17);
		
		new Transition(state0, state1, TransitionType.EPSILON);
		new Transition(state0, state4, TransitionType.EPSILON);
		new Transition(state1, state2, TransitionType.CHARACTER, 'a');
		new Transition(state2, state3, TransitionType.CHARACTER, 't');
		new Transition(state3, state7, TransitionType.EPSILON);
		new Transition(state4, state5, TransitionType.CHARACTER, 'g');
		new Transition(state5, state6, TransitionType.CHARACTER, 'a');
		new Transition(state6, state7, TransitionType.EPSILON);
		
		new Transition(state7, state8, TransitionType.EPSILON);
		new Transition(state7, state17, TransitionType.EPSILON);
		
		new Transition(state8, state9, TransitionType.EPSILON);
		new Transition(state8, state12, TransitionType.EPSILON);
		new Transition(state9, state10, TransitionType.CHARACTER, 'a');
		new Transition(state10, state11, TransitionType.CHARACTER, 'g');
		new Transition(state11, state16, TransitionType.EPSILON);
		new Transition(state12, state13, TransitionType.CHARACTER, 'a');
		new Transition(state13, state14, TransitionType.CHARACTER, 'a');
		new Transition(state14, state15, TransitionType.CHARACTER, 'a');
		new Transition(state15, state16, TransitionType.EPSILON);
		
		new Transition(state16, state17, TransitionType.EPSILON);
		new Transition(state16, state8, TransitionType.EPSILON);
	}
	
	
	@Test
	public void testConvertion() {
		DFA dfaAutomaton = NFAToDFAConverter.convert(nfaAutomaton);
		
		// Check DFA state count
		assertTrue(dfaAutomaton.getStates().size() == 9);
		
		// Check initial state
		Set<State> initialNFAStates = new LinkedHashSet<State>(Arrays.asList(state0, state1, state4));
		assertTrue(((DFAState)dfaAutomaton.getInitialState()).getNfaStates().equals(initialNFAStates));
		
		// Check final states
		Set<State> finalStates = dfaAutomaton.getFinalStates();
		
		assertTrue(finalStates.size() == 4);
				
		List<Set<State>> finalNFAStates = new ArrayList<Set<State>>();
		finalNFAStates.add(new LinkedHashSet<State>(Arrays.asList(state3, state7, state8, state9, state12, state17)));
		finalNFAStates.add(new LinkedHashSet<State>(Arrays.asList(state6, state7, state8, state9, state12, state17)));
		finalNFAStates.add(new LinkedHashSet<State>(Arrays.asList(state8, state9, state11, state12, state16, state17)));
		finalNFAStates.add(new LinkedHashSet<State>(Arrays.asList(state8, state9, state12, state15, state16, state17)));
		
		for(Set<State> fs : finalNFAStates) {
			boolean found = false;
			
			for(State finalState : finalStates) {
				if(fs.equals(((DFAState)finalState).getNfaStates())) {
					found = true;
					break;
				}
			}
			
			assertTrue(found);
		}
	}

}
