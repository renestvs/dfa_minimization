package br.ita.automaton.test;

import static org.junit.Assert.*;

import org.junit.Test;

import br.ita.automaton.core.dfa.DFA;
import br.ita.automaton.core.dfa.DFAMinimizer;
import br.ita.automaton.model.State;
import br.ita.automaton.service.DFAService;

public class DFATest {

	private DFA automaton;
	private DFAService service = new DFAService();
	private String input = "0\r\n1\r\n3\r\n4\r\n\r\n2\r\n\r\n0 b 0\r\n0 a 1\r\n1 a 0\r\n1 b 2\r\n4 b 2\r\n2 b 4\r\n4 a 3\r\n3 a 3\r\n3 b 3\r\n2 a 3";
	private String input2 = "A\r\nB\r\nD\r\nE\r\nF\r\nG\r\nH\r\n\r\nC\r\n\r\nA 0 B\r\nE 1 F\r\nE 0 H\r\nB 1 C\r\nB 0 G\r\nF 0 C\r\nF 1 G\r\nC 1 C\r\nD 0 C\r\nD 1 G\r\nH 1 C\r\nH 0 G\r\nG 0 G\r\nG 1 E";
	
	@Test
	public void testMountingDFA() {
		DFA dfa = service.createDFA(input);
		
		assertTrue(dfa.getStates().size() == 5);
		
		State initialState = dfa.getInitialState();
		
		assertEquals(dfa.getState(initialState, 'b'), initialState);
		
		assertTrue(dfa.getState(dfa.getState(initialState, 'a'), 'b').isAccept());
		
		assertTrue(dfa.getState(dfa.getState(
				dfa.getState(dfa.getState(initialState, 'a'), 'b'), 'b'), 'b').isAccept());
	}

}
