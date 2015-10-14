package br.ita.automaton.regex;

import java.util.HashSet;
import java.util.Set;

/**
 * Alphabet used in constructing regular expression
 *
 */
public class Alphabet {
	final private static String DEFAULT_ALPHABET="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"; 
	final private static String RESERVED_CHARACTERS="|*.()";
	
	private Set<Character> alphabet = new HashSet<Character>();

	private Set<Character> reserved_characters = new HashSet<Character>();
	
	public Alphabet(){
		this(DEFAULT_ALPHABET, RESERVED_CHARACTERS);
	}
	
	public Alphabet(String characters, String reserverCharacters) {
		for(char c : reserverCharacters.toCharArray()){
			reserved_characters.add(c);
		}
		for(char c : characters.toCharArray()){
			if ( checkIsReserved(c) ) throw new RuntimeException("Character "+c+" is reserved.");
			alphabet.add(c);
		}
	}
	
	public boolean checkAlphabet(char c) {
		return alphabet.contains(c);
	}
	
	public boolean checkIsReserved(char c) {
		return reserved_characters.contains(c);
	}
	
	public Set<Character> getAlphabet() {
		return alphabet;
	}
}