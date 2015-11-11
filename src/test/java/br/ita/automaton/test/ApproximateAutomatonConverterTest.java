package br.ita.automaton.test;

import java.util.Arrays;
import java.util.LinkedHashSet;

import org.junit.Before;
import org.junit.Test;

import br.ita.automaton.core.nfa.NFA;
import br.ita.automaton.model.*;
import br.ita.automaton.util.ApproximateAutomatonConverter;
import br.ita.automaton.util.TransitionType;

import static org.junit.Assert.*;

public class ApproximateAutomatonConverterTest {
	
	private Automaton automaton;
	
	
	@Before
	public void setUp() {
		automaton = new NFA();
		
		automaton.setAlphabet(new LinkedHashSet<Character>(Arrays.asList('a', 'g', 't')));
		
		State state0 = new State();
		State state1 = new State();
		State state2 = new State(true);
		State state3 = new State();
		State state4 = new State(true);
		State state5 = new State();
		State state6 = new State(true);
		State state7 = new State();
		State state8 = new State();
		State state9 = new State(true);
		
		
		automaton.addState(state0);
		automaton.setInitialState(state0);
		automaton.addState(state1);
		automaton.addState(state2);
		automaton.addState(state3);
		automaton.addState(state4);
		automaton.addState(state5);
		automaton.addState(state6);
		automaton.addState(state7);
		automaton.addState(state8);
		automaton.addState(state9);
		
		new Transition(state0, state1, TransitionType.CHARACTER, 'a');		
		new Transition(state0, state3, TransitionType.CHARACTER, 'g');
		
		new Transition(state1, state2, TransitionType.CHARACTER, 't');
		
		new Transition(state2, state5, TransitionType.CHARACTER, 'a');
		new Transition(state2, state7, TransitionType.CHARACTER, 'a');
		
		new Transition(state3, state4, TransitionType.CHARACTER, 'a');
		
		new Transition(state4, state5, TransitionType.CHARACTER, 'a');
		new Transition(state4, state7, TransitionType.CHARACTER, 'a');
		
		new Transition(state5, state6, TransitionType.CHARACTER, 'g');
		
		new Transition(state6, state7, TransitionType.CHARACTER, 'a');
		new Transition(state6, state5, TransitionType.CHARACTER, 'a');
		
		new Transition(state7, state8, TransitionType.CHARACTER, 'a');
		
		new Transition(state8, state9, TransitionType.CHARACTER, 'a');
		
		new Transition(state9, state5, TransitionType.CHARACTER, 'a');
		new Transition(state9, state7, TransitionType.CHARACTER, 'a');
	}

	
	@Test
	public void setConvert() {
		Automaton resultAutomaton = ApproximateAutomatonConverter.convert(automaton, 2);
		
		assertTrue(resultAutomaton.getStates().size() == 30);
		
		assertTrue(resultAutomaton.getFinalStates().size() == 12);
	}
}