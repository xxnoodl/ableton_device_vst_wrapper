/* Read-only discovery status panel, using the unchanged development device shell. */
autowatch=1;inlets=1;outlets=1;
mgraphics.init();mgraphics.relative_coords=0;mgraphics.autofill=0;
var message='Connecting to local studio…';
function status(text){message=String(text);mgraphics.redraw();}
function manifest(){}
function paint(){mgraphics.set_source_rgba(.10,.12,.14,1);mgraphics.paint();mgraphics.select_font_face('Arial');mgraphics.set_font_size(15);mgraphics.set_source_rgba(.72,.83,.76,1);mgraphics.move_to(10,26);mgraphics.show_text('LIVE SESSION');mgraphics.set_font_size(11);mgraphics.move_to(10,49);mgraphics.show_text('Read-only discovery');mgraphics.move_to(10,70);mgraphics.show_text('Click here to refresh');var line=message;while(line.length>1&&mgraphics.text_measure(line)[0]>mgraphics.size[0]-20)line=line.substring(0,line.length-2);mgraphics.set_font_size(10);mgraphics.move_to(10,105);mgraphics.show_text(line);}
function onclick(){outlet(0,'rescan');}
