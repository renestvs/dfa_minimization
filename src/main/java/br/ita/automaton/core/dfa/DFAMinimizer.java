package br.ita.automaton.core.dfa;

import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashSet;
import java.util.LinkedList;
import java.util.Map;
import java.util.Set;

import org.apache.log4j.Logger;

import br.ita.automaton.model.*;
import br.ita.automaton.util.TransitionType;

/**
 * DFA minimizer
 *
 */
public class DFAMinimizer {

	private static Logger logger = Logger.getLogger(DFAMinimizer.class);

	/**
	 * Minimize {@link DFA}
	 * 
	 * @param dfa
	 *            DFA
	 * 
	 * @return minimized DFA
	 */
	public static DFA minimize(DFA dfa) {
		
		Map<State, Set<State>> stateSetMapping = new HashMap<State, Set<State>>();
		
		logger.info("minimize - stateSetMapping 1st: " + stateSetMapping.toString());
		Set<Set<State>> sets = partition(dfa, stateSetMapping);
		
		logger.info("minimize - stateSetMapping 3rd: " + stateSetMapping.toString());
		return createMinimizedAutomaton(dfa, stateSetMapping, sets);
	}

	/**
	 * This method is responsable for ....
	 *
	 * @param ...
	 *            ...
	 * @param ...
	 *            ...
	 * @return ...
	 *         	  ...
	 */
	private static Set<Set<State>> partition(DFA automaton, Map<State, Set<State>> stateSetMapping) {

		Set<Set<State>> sets = initSets(automaton, stateSetMapping);
		Set<Set<State>> partition = null;

		while (!sets.equals(partition)) {
			partition = sets;
			logger.info("partition - partition=sets: " + partition.toString());

			sets = new LinkedHashSet<Set<State>>();
			logger.info("partition - clear sets: " + sets.toString());
			
			for (Set<State> set : partition) {
				logger.info("partition - split : automaton| " + automaton.toString() + " |set| " + set.toString()
						+ " |stateSetMapping| " + stateSetMapping.toString() + " |sets| " + sets.toString());
				split(automaton, set, stateSetMapping, sets);
			}
			logger.info("partition - end while sets = " + sets.toString());
			logger.info("partition - end while partition =  " + partition.toString());
		}

		
		return sets;
	}

	/**
	 * This method is responsable for ....
	 *
	 * @param DFA
	 *            the automata to be searched.
	 * @param stateSetMapping
	 *            the set States Mapped from automata inputed.
	 * @return two different State sets, first only with final States, and
	 *         second with non-final States from the automata inputed.
	 */
	private static Set<Set<State>> initSets(DFA automaton, Map<State, Set<State>> stateSetMapping) {

		Set<Set<State>> sets = new LinkedHashSet<Set<State>>();

		Set<State> finalStates = new LinkedHashSet<State>();
		Set<State> nonFinalStates = new LinkedHashSet<State>();

		for (State state : automaton.getStates()) {
			Set<State> set = state.isAccept() ? finalStates : nonFinalStates;

			set.add(state);

			stateSetMapping.put(state, set);
			logger.info("stateSetMapping.put - FOR : " + stateSetMapping.toString());
		}

		logger.info("sets BEFORE finalStates: " + sets.toString());
		sets.add(finalStates);
		logger.info("sets BEFORE nonfinalStates: " + sets.toString());
		sets.add(nonFinalStates);
		logger.info("sets : " + sets.toString());

		return sets;
	}

	/**
	 * This method is responsable for ....
	 *
	 * @param ...
	 *            ...
	 * @param ...
	 *            ....
	 *            
	 * @return ...
	 *         	  ....
	 */
	private static void split(DFA automaton, Set<State> set, Map<State, Set<State>> stateSetMapping,
			Set<Set<State>> sets) {

		Set<State> firstSet = null;
		Set<State> secondSet = null;

		boolean splitted = false;

		for (Character c : automaton.getAlphabet()) {
			logger.info("split - " + c);
			
			firstSet = new LinkedHashSet<State>();
			secondSet = new LinkedHashSet<State>();
			
			Set<State> firstToSet = null;

			boolean first = true;
			
			for (State state : set) {
				State toState = automaton.getState(state, c);
				logger.info("split - state: " + state.toString());
				
				Set<State> toSet = toState == null ? null : stateSetMapping.get(toState);
				logger.info("split - toState == null: " + (toState == null));
				
				logger.info("split - first: " + first);
				if (first) {
					logger.info("split - if first true ");
					
					firstToSet = toSet;
					firstSet.add(state);
					logger.info("split - if first true add state in firstSet");

					first = false;
				} else if (firstToSet == null && toSet == null || firstToSet != null && firstToSet.equals(toSet)) {
					firstSet.add(state);
					logger.info("split - else if first false add firstToSet ");
				} else {
					logger.info("split - else add secondSet " + state.toString());
					secondSet.add(state);
					logger.info("split - else add state " + state.toString());
					logger.info("split - else add secondSet " + secondSet.toString());
				}
			}
			
			logger.info("split - secondSet.isEmpty: " + secondSet.isEmpty());
			if (!secondSet.isEmpty()) {
				splitted = true;
				logger.info("split - BREAK ");
				break;
			}
		}

		if (splitted) {
			logger.info("split - splitted TRUE ");
			for (State state : firstSet) {
				stateSetMapping.put(state, firstSet);
				logger.info("split - 1st for: state| " + state.toString() + " |firstSet| "+ firstSet.toString() + " |stateSetMapping| " + stateSetMapping.toString());
			}

			for (State state : secondSet) {
				stateSetMapping.put(state, secondSet);
				logger.info("split - 2nd for: state| " + state.toString() + " |secondSetSet| "+ secondSet.toString() + " |stateSetMapping| " + stateSetMapping.toString());
			}
			logger.info("split - sets BEFORE: " + sets.toString());
			logger.info("split - firstSet: " + firstSet.toString());
			logger.info("split - secondSet: " + secondSet.toString());
			sets.add(firstSet);
			sets.add(secondSet);
			logger.info("split - sets AFTER: " + sets.toString());
		} else {
			logger.info("split - splitted FALSE: sets BEFORE| " + sets.toString());
			sets.add(set);
			logger.info("split - splitted FALSE: sets AFTER| " + sets.toString());
		}
	}

	/**
	 * This method is responsable for ....
	 *
	 * @param ...
	 *            ...
	 * @param ...
	 *            ....
	 *            
	 * @return ...
	 *         	  ....
	 */
	private static DFA createMinimizedAutomaton(DFA automaton, Map<State, Set<State>> stateSetMapping,
			Set<Set<State>> sets) {

		// Create new empty dfaMinimized
		DFA minimizedAutomaton = new DFA();

		// Set the DFAminimized alphabet
		minimizedAutomaton.setAlphabet(automaton.getAlphabet());

		// Create new empty set with minimized State Mapping
		Map<Set<State>, State> minimizedSetStateMapping = new HashMap<Set<State>, State>();

		// According to DFA States, this for creates DFA States for this new
		// empty DFA Minimized
		for (Set<State> set : sets) {
			State minimizedState = new DFAState();
			minimizedSetStateMapping.put(set, minimizedState);
		}
		logger.debug("createMinimizedAutomaton - minimizedSetStateMapping.toString() = " + minimizedSetStateMapping.toString());
		// A linkedlist is create to insert only valid DFA minimized states
		LinkedList<State> minimizedStates = new LinkedList<State>();

		for (Set<State> set : sets) {
			logger.debug("createMinimizedAutomaton - FOR set.toString() = " + set.toString());
			if (set.isEmpty()) { // non-final sets can be empty
				logger.debug("createMinimizedAutomaton - set.isEmpty() = " + set.isEmpty());
				continue;
			}
			logger.debug("createMinimizedAutomaton - set.iterator().next() = " + set.iterator().next());
			State state = set.iterator().next();

			State minimizedState = minimizedSetStateMapping.get(set);
			logger.debug("createMinimizedAutomaton - minimizedState = " + minimizedState.toString());
			
			for (Character c : automaton.getAlphabet()) {
				State toState = automaton.getState(state, c);

				if (toState != null) {
					Set<State> toStateSet = stateSetMapping.get(toState);
					logger.debug("createMinimizedAutomaton - toStateSet = " + toStateSet.toString());
					
					State minimizedToState = minimizedSetStateMapping.get(toStateSet);
					logger.debug("createMinimizedAutomaton - minimizedToState = " + minimizedToState.toString());
					
					minimizedToState.setNumber(updateStateNumber(toStateSet));
					
					new Transition(minimizedState, minimizedToState, TransitionType.CHARACTER, c);
				}
			}

			boolean initial = false;
			for (State s : set) {
				if (automaton.getInitialState().equals(s)) {
					initial = true;
					break;
				}
			}

			if (initial) {
				minimizedState.setNumber(updateStateNumber(set));
				minimizedStates.addFirst(minimizedState);
			} else {
				minimizedStates.addLast(minimizedState);
			}

			if (state.isAccept()) {
				minimizedState.setAccept(true);
			}

			logger.info("minimizedState == " + minimizedStates.toString());
		}
		logger.info("minimizedState|SET == " + sets.toString());
		logger.info("minimizedState == " + minimizedStates.toString());

		boolean first = true;
		State tempState = new State();
		for (State minimizedState : minimizedStates) {
			//testing
			logger.debug(" minimizedState == " + minimizedState.toString());
			if (first) {				
				tempState = minimizedAutomaton.addState(minimizedState);
				minimizedAutomaton.setInitialState(minimizedState);
				logger.debug("getInitialState = " + minimizedAutomaton.getStates());
				logger.debug("getAlphabet = " + minimizedAutomaton.getAlphabet());
				first = false;
			} else {
				minimizedAutomaton.addState(minimizedState);
				logger.debug("getState = " + minimizedAutomaton.getStates());
				logger.debug("getAlphabet = " + minimizedAutomaton.getAlphabet());
			}
		}
		logger.debug("getFinalStates = " + minimizedAutomaton.getFinalStates());
		
		return minimizedAutomaton;
	}

	private static String updateStateNumber(Set<State> toStateSet) {
		String newStateNumber = "";
		for (Iterator iterator = toStateSet.iterator(); iterator.hasNext();) {
			State tmpState = (State) iterator.next();
			newStateNumber += tmpState.getNumber();
			
		}
		return newStateNumber;
	}

}