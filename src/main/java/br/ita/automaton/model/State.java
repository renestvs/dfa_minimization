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

	private Long number;
	
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
	
	
	public Long getNumber() {
		return number;
	}

	public void setNumber(Long number) {
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
			append(id).
			toString();
	}

	//@Override
	public String toDot() {
		StringBuilder sb = new StringBuilder();
		if (accept) {
			sb.append(id+ " [shape=doublecircle,label=\""+id+"\"]\n");
		}else{
			sb.append(id+ " [shape=circle,label=\""+id+"\"]\n");
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
}