package br.ita.automaton.test;
import static org.junit.Assert.*;
import java.io.File;
import org.junit.Test;
import br.ita.automaton.visual.GraphViz;

public class GraphVizTest {

	@Test
	public void visualTest() {
		GraphViz gv = new GraphViz();
		System.out.println(gv.TEMP_DIR);
		gv.addln(gv.start_graph());
		gv.addln("A -> B;");
		gv.addln("A -> C;");
		gv.addln(gv.end_graph());
		System.out.println(gv.getDotSource());

		gv.increaseDpi();   // 106 dpi

		String type = "gif";
		//      String type = "dot";
		//      String type = "fig";    // open with xfig
		//      String type = "pdf";
		//      String type = "ps";
		//      String type = "svg";    // open with inkscape
		//      String type = "png";
		//      String type = "plain";
		
		String repesentationType= "dot";
		//		String repesentationType= "neato";
		//		String repesentationType= "fdp";
		//		String repesentationType= "sfdp";
		// 		String repesentationType= "twopi";
		// 		String repesentationType= "circo";
		
		//File out = new File("/tmp/out"+gv.getImageDpi()+"."+ type);   // Linux
		File out = new File(gv.TEMP_DIR + "/out." + type); // Windows
		gv.writeGraphToFile( gv.getGraph(gv.getDotSource(), type, repesentationType), out );
		
		assertNotNull(out);

	}

}
