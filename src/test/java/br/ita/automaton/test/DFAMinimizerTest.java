package br.ita.automaton.test;

import java.io.File;
import java.util.Arrays;
import java.util.LinkedHashSet;

import org.apache.log4j.Logger;
import org.junit.Before;
import org.junit.Test;

import br.ita.automaton.core.*;
import br.ita.automaton.dfa.*;
import br.ita.automaton.visual.GraphViz;

import static org.junit.Assert.*;

public class DFAMinimizerTest {
	
	private DFA automaton;
	private GraphViz gv;
	
	private static Logger logger = Logger.getLogger(DFAMinimizerTest.class);
	
	@Before
	public void setUp() {
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
	}
	
	
	@Test
	public void testMinimize() {
		logger.info("testMinimize");

		String type = "gif";
		String repesentationType= "dot";
		
		// Visual DFA		
		gv.addln(automaton.toDot());
		logger.info(gv.getDotSource());
		gv.increaseDpi();   
		File out = new File(gv.TEMP_DIR + "/dfa." + type);
		gv.writeGraphToFile(gv.getGraph(gv.getDotSource(), type, repesentationType), out);
		gv.clearGraph();
		
		DFA minimized = DFAMinimizer.minimize(automaton);
		
		// Visual DFA Minimized
		gv.addln(minimized.toDot());
		logger.info(gv.getDotSource());
		out = new File(gv.TEMP_DIR + "/minimized-dfa." + type); 
		gv.writeGraphToFile(gv.getGraph(gv.getDotSource(), type, repesentationType), out);
		
		assertTrue(minimized.getStates().size() == 5);
		
		State initialState = minimized.getInitialState();
		
		assertEquals(minimized.getState(initialState, 'b'), initialState);
		
		assertTrue(minimized.getState(minimized.getState(initialState, 'a'), 'b').isAccept());
		
		assertTrue(minimized.getState(minimized.getState(
			minimized.getState(minimized.getState(initialState, 'a'), 'b'), 'b'), 'b').isAccept());
	}
	
}