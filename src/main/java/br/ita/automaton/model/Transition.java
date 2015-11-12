package br.ita.automaton.model;

import java.io.Serializable;

import br.ita.automaton.util.TransitionType;
import br.ita.automaton.visual.Visualizable;

/**
 * Finite state automata transition representation
 *
 */
public class Transition implements Visualizable, Serializable {
	private static final long serialVersionUID = 1651636231996879684L;
	
	private State from;
	private State to;
	
	private Character character;
	
	private TransitionType type;
	
	
		
	public Transition(State from, State to, TransitionType type) {
		this(from, to, type, null);
	}
	
	public Transition(State from, State to, TransitionType type, Character character) {
		setFrom(from);
		setTo(to);
		
		this.type = type;
		this.character = character;
	}

	
	public State getFrom() {
		return from;
	}
	
	public void setFrom(State from) {
		this.from = from;
		
		from.addOutgoing(this);
	}
	
	
	public State getTo() {
		return to;
	}
	
	public void setTo(State to) {
		this.to = to;
	}
	

	public Character getCharacter() {
		return character;
	}

	public void setCharacter(Character character) {
		this.character = character;
	}

	
	public TransitionType getType() {
		return type;
	}

	public void setType(TransitionType type) {
		this.type = type;
	}
	
	public boolean isCharacter() {
		return TransitionType.CHARACTER.equals(type);
	}
	
	public boolean isEpsilon() {
		return TransitionType.EPSILON.equals(type);
	}
	
	public boolean isAlphabet() {
		return TransitionType.ALPHABET.equals(type);
	}
	
	
	@Override
	public String toString() {
		return new StringBuilder("Transition: ").
			append("From - ").append(from).
			append(", To - ").append(to).
			append(", Type - ").append(type).
			append(", Character - ").append(character).
			toString();
	}

	//@Override
	public String toDot() {
		if(isEpsilon()) {
			return from.getNumber()+ " -> "+to.getNumber()+"[label=\""+'ε'+"\",style=\"dotted\"]"+"\n";
		}
		else if(isAlphabet()) {
			return from.getNumber()+ " -> "+to.getNumber()+"[label=\""+'Σ'+"\"]"+"\n";
		}
		else {
			return from.getNumber()+ " -> "+to.getNumber()+"[label=\""+character+"\"]"+"\n";
		}
	}
}