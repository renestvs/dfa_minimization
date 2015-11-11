package br.ita.automaton.core.regex;

import java.util.Set;

import br.ita.automaton.core.nfa.NFA;
import br.ita.automaton.model.*;
import br.ita.automaton.util.TransitionType;
import br.ita.automaton.visual.Visualizable;

/**
 * Regular expression
 *
 */
public class RegularExpression implements Visualizable {
	
	/**
	 *  Regular expression to NFA converting strategy 
	 */
	public enum Strategy {THOMPSON, GLUSHKOV}
	
	/* Special characters */
	final private static char UNION_CHAR='|';
	final private static char KLEENE_CLOSURE_CHAR='*';
	final private static char ANY_CHAR='.';
	final private static char EMPTY_CHAR='ε';
	final private static char START_PARENTHESIS='(';
	final private static char END_PARENTHESIS=')';
	
	/* next node id */
	private static int nextId = 0;
	
	private Alphabet alphabet;
	
	private Node root;

	/**
	 * Constructs regular expression parse tree from regular expression string representation
	 * 
	 * @param regex string representation
	 */
	public RegularExpression(String regex) {
		this.alphabet = new Alphabet();
		Parser p = new Parser(regex);
		root = p.parse();
	}
	
	public RegularExpression(Node rootNode){
		this.root = rootNode;
	}
	
	/**
	 * Build NFA from current regular expression 
	 *  
	 * @param strategy {@link Strategy} to use when constructing regular expression
	 * 
	 * @return constructed {@link NFA}
	 */
	public NFA toAutomaton(Strategy strategy){
		return root.buildNFA(strategy);
	}
	
	@Override
	public String toString() {
		return root.toString();
	}
	
	/**
	 * Return Graphviz dot representation of regular expression tree
	 * 
	 * @return Graphviz dot representation
	 */
	public String toDot() {
		StringBuilder b = new StringBuilder("digraph RegularExpression {\n");
		b.append("  rankdir = LR;\n");
		b.append(root.toDot());
		return b.append("}\n").toString();
	}
	
	/**
	 * Regular expression parser.
	 * 
	 * Creates regular expression tree from regular expression string 
	 *
	 */
	public class Parser {
		
		private String regex;
		
		private int index;
		
		public Parser(String regex) {
			this.regex = regex;
		}
		
		private void move() {
			index++;
		}
		
		private char next() {
			if(more()) {
				return regex.charAt(index);
			}
			throw new RuntimeException("Unexpected end of regex");
		}
		
		private boolean more() {
			return index < regex.length();
		}
		
		private boolean match(char c) {
			return more() ? regex.charAt(index) == c : false;
		}
		
		private boolean matchAndMove(char c) {
			if (match(c)) {
				move();
				return true;
			}
			return false;
		}
		
		private boolean isInAlphabet() {
			return alphabet.checkAlphabet(regex.charAt(index));
		}
		
		private boolean isSpecialChar() {
			return alphabet.checkIsReserved(regex.charAt(index));
		}

		private Node parse() {
			return parseUnion();
		}
		
		private Node parseUnion() {
            Node node = parseConcatenation();
            if (matchAndMove(UNION_CHAR))
                node = new UnionNode(node, parseUnion());
            return node;
			
		}
		
		private Node parseConcatenation() {
			Node node = parseKleeneClosure();
			if(more() && ( next() != END_PARENTHESIS && next() != UNION_CHAR) ) {
				node = new ConcatenationNode(node, parseConcatenation());
			}
			return node;
			
		}
		
		private Node parseKleeneClosure() {
			Node node = parseSymbol();
			if(more() && matchAndMove(KLEENE_CLOSURE_CHAR)) {
				node = new KleeneClosureNode(node);
			}
			if(match(KLEENE_CLOSURE_CHAR)){
				throw new RuntimeException("Unexpected character");
			}
			return node;
			
		}
		
		private Node parseSymbol() {
			char c = regex.charAt(index);
			if(matchAndMove(ANY_CHAR)) {
				return new SymbolNode(ANY_CHAR);
			}
			else if (matchAndMove(EMPTY_CHAR)) {
				return new SymbolNode(EMPTY_CHAR);
			}
			else if (matchAndMove(START_PARENTHESIS)) {
				Node node = parseUnion();
				if(!matchAndMove(END_PARENTHESIS)) {
					throw new RuntimeException("Expected "+END_PARENTHESIS+" instead of "+c+" in position "+index);
				}
				node = new ParenthesesNode(node);
				return node;
			}
			else if (isSpecialChar()) {
				throw new RuntimeException("Illegal character");
			}
			else if (!isInAlphabet()) {
				throw new RuntimeException("Character not in alphabet");
			}
			else {
				move();
				return new SymbolNode(c);
			}			
		}
	}
	
	/**
	 * Regular expression tree node base class
	 *
	 */
	public abstract class Node implements Visualizable {
		
		/* unique node identifier */
		protected int id;
		
		public Node() {
			this.id=getNextId();
		}
		
		public NFA buildNFA(Strategy strategy) {
			return strategy == Strategy.THOMPSON ? toNFAThompson() : toNFAGlushkov();
		}
		
		/**
		 * Build Glushkov {@link NFA} from regular expression
		 *  
		 * @return {@link NFA}
		 */
		protected abstract NFA toNFAGlushkov();
		
		/**
		 * Build Thompson {@link NFA} from regular expression
		 *  
		 * @return {@link NFA}
		 */
		protected abstract NFA toNFAThompson();
		
		public abstract String toDot();
		
		@Override
		public abstract String toString();

		public void setId(int id) {
			this.id = id;
		}

		public int getId() {
			return id;
		}
		
	}
	
	/**
	 * Regex tree node containing symbol
	 *
	 */
	public class SymbolNode extends Node {
		private char symbol;

		public SymbolNode(char symbol) {
			this.setSymbol(symbol);
		}

		@Override
		protected NFA toNFAGlushkov() {
			// Same as toNFAThompson
			return toNFAThompson();
		}

		@Override
		protected NFA toNFAThompson() {
			NFA automaton = new NFA();
			automaton.setAlphabet(alphabet.getAlphabet());
			State start = new State();
			automaton.addState(start);
			automaton.setInitialState(start);
			State end = new State(true);
			automaton.addState(end);
			if(symbol == EMPTY_CHAR) {
				new Transition(start, end, TransitionType.EPSILON);
			}
			else if(symbol == ANY_CHAR) {
				new Transition(start, end, TransitionType.ALPHABET);
			}
			else {
				new Transition(start, end, TransitionType.CHARACTER, symbol);
			}
			return automaton;
		}

		@Override
		public String toDot() {
			StringBuilder sb = new StringBuilder();
			sb.append(id+ " [shape=circle,label=\""+symbol+"\"]\n");
			return sb.toString();
		}

		public void setSymbol(char symbol) {
			this.symbol = symbol;
		}

		public char getSymbol() {
			return symbol;
		}


		@Override
		public String toString() {
			return String.valueOf(symbol);
		}
	}
	
	/**
	 * Regex tree node representing parentheses
	 *
	 */
	public class ParenthesesNode extends Node {
		private Node node;

		public ParenthesesNode(Node node) {
			this.node = node;
		}

		@Override
		public String toDot() {
			StringBuilder sb = new StringBuilder();
			sb.append(id+ " [shape=circle,label=\""+START_PARENTHESIS+END_PARENTHESIS+"\"]\n");
			
			sb.append(id+ " -> "+node.id+"\n");
			sb.append(node.toDot());
			return sb.toString();
		}

		@Override
		protected NFA toNFAGlushkov() {
			return node.toNFAGlushkov();
		}

		@Override
		protected NFA toNFAThompson() {
			return node.toNFAThompson();
		}

		@Override
		public String toString() {
			return START_PARENTHESIS+node.toString()+END_PARENTHESIS;
		}

		public void setNode(Node node) {
			this.node = node;
		}

		public Node getNode() {
			return node;
		}
	}
	
	/**
	 * Regex tree node representing union
	 *
	 */
	public class UnionNode extends Node {
		
		private Node left;
		private Node right;

		public UnionNode(Node left, Node right) {
			this.setLeft(left);
			this.setRight(right);
		}

		@Override
		protected NFA toNFAGlushkov() {
			NFA leftAutomaton = left.toNFAGlushkov();
			NFA rightAutomaton = right.toNFAGlushkov();
			NFA unionAutomaton = new NFA();
			unionAutomaton.setAlphabet(alphabet.getAlphabet());
			State leftStart = leftAutomaton.getInitialState();
			State rightStart = rightAutomaton.getInitialState();
			
			//1. Add all states from left and right automaton except right start state
			unionAutomaton.addStates(leftAutomaton.getStates());
			for(State state : rightAutomaton.getStates()) {
				if(state != rightStart) {
					unionAutomaton.addState(state);
				}
			}
			
			//2. Add right start state transitions to new start state
			for(Transition transition : rightStart.getOutgoing()) {
				transition.setFrom(leftStart);
			}
			unionAutomaton.setInitialState(leftStart);
			return unionAutomaton;
		}

		@Override
		protected NFA toNFAThompson() {
			NFA automaton = new NFA();
			automaton.setAlphabet(alphabet.getAlphabet());
			//1. add start state
			State start = new State();
			automaton.addState(start);
			automaton.setInitialState(start);
			
			//1. add all existing states (and transitions) to new automaton
			NFA leftAutomaton = left.toNFAThompson();
			automaton.addStates(leftAutomaton.getStates());
			NFA rightAutomaton = right.toNFAThompson();
			automaton.addStates(rightAutomaton.getStates());
			
			//2. add end state to automaton
			State end = new State(true);
			automaton.addState(end);
			
			// 2. connect old start states to new start state
			new Transition(start, leftAutomaton.getInitialState(), TransitionType.EPSILON);
			new Transition(start, rightAutomaton.getInitialState(), TransitionType.EPSILON);
			
			// 2. connect old end states to new end state
			Set<State> finalStates = leftAutomaton.getFinalStates();
			finalStates.addAll(rightAutomaton.getFinalStates());
			for (State state : finalStates) {
				state.setAccept(false);
				new Transition(state, end, TransitionType.EPSILON);
			}			
			
			return automaton;
		}

		@Override
		public String toDot() {
			StringBuilder sb = new StringBuilder();
			sb.append(id+ " [shape=circle,label=\""+UNION_CHAR+"\"]\n");

			sb.append(id+ " -> "+right.id+"\n");
			sb.append(right.toDot());
			
			sb.append(id+ " -> "+left.id+"\n");
			sb.append(left.toDot());
			
			
			return sb.toString();
		}

		public void setLeft(Node left) {
			this.left = left;
		}

		public Node getLeft() {
			return left;
		}

		public void setRight(Node right) {
			this.right = right;
		}

		public Node getRight() {
			return right;
		}

		@Override
		public String toString() {
			return left.toString()+UNION_CHAR+right.toString();
		}
		
	}
	
	/**
	 * Regex tree node representing concatenation
	 *
	 */
	public class ConcatenationNode extends Node {
		
		private Node left;
		private Node right;

		public ConcatenationNode(Node left, Node right) {
			this.setLeft(left);
			this.setRight(right);
		}

		@Override
		protected NFA toNFAGlushkov() {
			NFA automaton = new NFA();
			automaton.setAlphabet(alphabet.getAlphabet());		
			NFA leftAutomaton = left.toNFAGlushkov();
			NFA rightAutomaton = right.toNFAGlushkov();
			automaton.addStates(leftAutomaton.getStates());
			automaton.setInitialState(leftAutomaton.getInitialState());
			for(State state : leftAutomaton.getFinalStates()) {
				if(!rightAutomaton.getInitialState().isAccept()) {
					state.setAccept(false);
				}
				
				for(Transition transition : rightAutomaton.getInitialState().getOutgoing()) {
					new Transition(state, transition.getTo(), transition.getType(), transition.getCharacter());
					transition = null;
				}
			}
			for(State state : rightAutomaton.getStates()) {
				if(state != rightAutomaton.getInitialState()) {
					automaton.addState(state);
				}
			}
			return automaton;
		}

		@Override
		protected NFA toNFAThompson() {
			NFA automaton = new NFA();
			automaton.setAlphabet(alphabet.getAlphabet());
			NFA leftAutomaton = left.toNFAThompson();
			NFA rightAutomaton = right.toNFAThompson();
			
			//1. add all existing states (and transitions) to new automaton and set initial state
			automaton.addStates(leftAutomaton.getStates());
			automaton.addStates(rightAutomaton.getStates());
			automaton.setInitialState(leftAutomaton.getInitialState());
			
			// 2. connect right automaton end states to left automaton start state
			for(State end : leftAutomaton.getFinalStates()) {
				end.setAccept(false);
				new Transition(end, rightAutomaton.getInitialState(), TransitionType.EPSILON);
			}
			
			return automaton;
		}

		@Override
		public String toDot() {
			StringBuilder sb = new StringBuilder();
			sb.append(id+ " [shape=circle,label=\""+"&"+"\"]\n");
			
			sb.append(id+ " -> "+right.id+"\n");
			sb.append(right.toDot());
			
			sb.append(id+ " -> "+left.id+"\n");
			sb.append(left.toDot());

			
			return sb.toString();
		}

		public void setLeft(Node left) {
			this.left = left;
		}

		public Node getLeft() {
			return left;
		}

		public void setRight(Node right) {
			this.right = right;
		}

		public Node getRight() {
			return right;
		}

		@Override
		public String toString() {
			return left.toString()+right.toString();
		}
		
	}
	
	/**
	 * Regex tree node representing Kleene closure
	 *
	 */
	public class KleeneClosureNode extends Node {
		
		private Node node;

		public KleeneClosureNode(Node node) {
			this.setNode(node);
		}

		@Override
		protected NFA toNFAGlushkov() {
			NFA automaton = node.toNFAGlushkov();
			automaton.getInitialState().setAccept(true);
			for(State state : automaton.getFinalStates()) {
				for(Transition transition : automaton.getInitialState().getOutgoing()) {
					if(!state.getOutgoing().contains(transition)) {
						new Transition(state, transition.getTo(), transition.getType(), transition.getCharacter());
					}
				}
			}
			return automaton;
		}

		@Override
		protected NFA toNFAThompson() {
			NFA automaton = new NFA();
			automaton.setAlphabet(alphabet.getAlphabet());

			//1. Add new start state
			State start = new State();
			automaton.addState(start);
			automaton.setInitialState(start);
			//2. Add all existing states (and transitions)
			NFA childAutomaton = node.toNFAThompson();
			automaton.addStates(childAutomaton.getStates());
			//3. Add new end state
			State end = new State(true);
			automaton.addState(end);
			//2. Add new transitions
			new Transition(start, childAutomaton.getInitialState(), TransitionType.EPSILON);
			new Transition(start, end, TransitionType.EPSILON);
			for(State state : childAutomaton.getFinalStates()) {
				state.setAccept(false);
				new Transition(state, childAutomaton.getInitialState(), TransitionType.EPSILON);
				new Transition(state, end, TransitionType.EPSILON);
			}
			return automaton;
		}

		@Override
		public String toDot() {
			StringBuilder sb = new StringBuilder();
			sb.append(id+ " [shape=circle,label=\""+KLEENE_CLOSURE_CHAR+"\"]\n");
			
			sb.append(id+ " -> "+node.id+"\n");
			sb.append(node.toDot());
			return sb.toString();
		}

		public void setNode(Node node) {
			this.node = node;
		}

		public Node getNode() {
			return node;
		}

		@Override
		public String toString() {
			return node.toString()+KLEENE_CLOSURE_CHAR;
		}
		
	}
	
	/**
	 * Get next ID
	 * @return id
	 */
	private static int getNextId() {
		return nextId++;
	}
}