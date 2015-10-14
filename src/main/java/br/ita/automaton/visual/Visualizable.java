package br.ita.automaton.visual;

/**
 * Interface for all visualizable classes 
 * 
 * @author Kristjan Vedel
 *
 */
public interface Visualizable {
	
	/**
	 * Return objects Graphviz dot representation
	 * 
	 * @return Graphviz dot representation
	 */
	String toDot();

}