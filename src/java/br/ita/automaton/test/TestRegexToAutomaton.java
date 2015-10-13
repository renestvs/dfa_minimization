package br.ita.automaton.test;

import br.ita.automaton.approximate.ApproximateAutomatonConverter;
import br.ita.automaton.core.Automaton;
import br.ita.automaton.dfa.*;
import br.ita.automaton.nfa.NFA;
import br.ita.automaton.regex.RegularExpression;


public class TestRegexToAutomaton {

	public static void main(String[] args) {
		
		RegularExpression regex = new RegularExpression("a|b*c(aa|cb)*b");
		NFA nfa = regex.toAutomaton(RegularExpression.Strategy.THOMPSON);
		DFA dfa = NFAToDFAConverter.convert(nfa);
		DFA minimizedDFA = DFAMinimizer.minimize(dfa);
		Automaton a = ApproximateAutomatonConverter.convert(minimizedDFA, 1);
		System.out.println(minimizedDFA.toDot());

	}

}