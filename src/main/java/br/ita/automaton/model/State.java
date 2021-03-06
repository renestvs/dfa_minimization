package br.ita.automaton.model;

import java.io.Serializable;
import java.util.LinkedHashSet;
import java.util.Set;

import br.ita.automaton.visual.Visualizable;

/**
 * Finite state automata state representation
 *
 */
public class State implements Visualizable, Serializable{
	private static final long serialVersionUID = -8889494968704958207L;
	
	private int id;
	private static int nextId;

	private String number;
	
	private boolean accept;

	private Set<Transition> outgoing = new LinkedHashSet<Transition>();
	
	/**
	 * Create new state
	 * 
	 * @param accept if true, state is accept state
	 */
	public State(boolean accept){
		this();
		this.accept = true;
	}
	
	/**
	 * Create new state
	 */
	public State(){
		id = getNextId();
	}
	
	
	public String getNumber() {
		return number;
	}

	public void setNumber(String number) {
		this.number = number;
	}
	
	
	public boolean isAccept() {
		return accept;
	}

	public void setAccept(boolean accept) {
		this.accept = accept;
	}
	
	public Set<Transition> getOutgoing() {
		return outgoing;
	}

	public void setOutgoing(Set<Transition> outgoing) {
		this.outgoing = outgoing;
	}
	
	public void addOutgoing(Transition transition) {
		outgoing.add(transition);
	}
	
	

	@Override
	public String toString() {
		return new StringBuilder("State: ").
			append(number).
			toString();
	}

	//@Override
	public String toDot() {
		StringBuilder sb = new StringBuilder();
		if (accept) {
			sb.append(number+ " [shape=doublecircle,label=\""+number+"\"]\n");
		}else{
			sb.append(number+ " [shape=circle,label=\""+number+"\"]\n");
		}

		for(Transition t : getOutgoing()) {
			sb.append(t.toDot());
		}		
		return sb.toString();
	}
	
	public int getId() {
		return id;
	}
	
	/**
	 * Get next ID
	 * @return id
	 */
	private static int getNextId() {
		return nextId++;
	}
	
	// testes
	
	private boolean visited;

	public boolean isVisited() {
		return visited;
	}

	public void setVisited(boolean visited) {
		this.visited = visited;
	}
	
	private boolean reachable;

	public boolean isReachable() {
		return reachable;
	}

	public void setReachable(boolean reachable) {
		this.reachable = reachable;
	}
	
}