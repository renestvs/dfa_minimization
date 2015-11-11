package br.ita.automaton.core.dfa;

import br.ita.automaton.model.*;

/**
 * Deterministic finite automaton
 *
 */
public class DFA extends Automaton {
	private static final long serialVersionUID = -7798808243731550723L;

	public State getState(State state, Character character) {
		for(Transition transition : state.getOutgoing()) {
			if(transition.isCharacter() && 
					transition.getCharacter().equals(character)) {
				return transition.getTo();
			} 
		}		
		return null;
	}

}