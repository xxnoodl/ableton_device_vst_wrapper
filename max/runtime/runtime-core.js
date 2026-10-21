/* Shared ES5-compatible runtime contract. No evaluated expressions or plugin DSP. */
var RuntimeCore = (function () {
    function fail(message) { throw new Error(message); }
    function finite(value) { return typeof value === 'number' && isFinite(value); }
    function array(value) { return Object.prototype.toString.call(value) === '[object Array]'; }
    function text(value) { return typeof value === 'string' && value.length > 0 && value.length <= 160 && !/[\x00-\x1f]/.test(value); }
    function keys(o, allowed) {
        if (!o || typeof o !== 'object' || array(o)) fail('Expected object');
        for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k) && allowed.indexOf(k) < 0) fail('Unknown field: ' + k);
        for (var i = 0; i < allowed.length; i++) if (!Object.prototype.hasOwnProperty.call(o, allowed[i])) fail('Missing field: ' + allowed[i]);
    }
    function validate(manifest) {
        var fields=['runtimeVersion','projectId','name','pluginName','theme','panel','demoOnly','parameters','widgets'];
        if(Object.prototype.hasOwnProperty.call(manifest,'autoBindPrevious')){fields.push('autoBindPrevious');if(typeof manifest.autoBindPrevious!=='boolean')fail('Invalid automatic binding option');}
        if(Object.prototype.hasOwnProperty.call(manifest,'panelStyle')){fields.push('panelStyle');keys(manifest.panelStyle,['seams']);if(['none','line','groove'].indexOf(manifest.panelStyle.seams)<0)fail('Invalid panel style');}
        if(Object.prototype.hasOwnProperty.call(manifest,'connections'))fields.push('connections');
        keys(manifest, fields);
        if (manifest.runtimeVersion !== 1) fail('Unsupported runtime version');
        if (!text(manifest.projectId) || !text(manifest.name) || !text(manifest.pluginName)) fail('Invalid project identity');
        if (['dark','light'].indexOf(manifest.theme) < 0 || typeof manifest.demoOnly !== 'boolean') fail('Invalid theme or provenance');
        keys(manifest.panel,['width','height']);
        if (!finite(manifest.panel.width) || manifest.panel.width < 320 || manifest.panel.width > 1600 || !finite(manifest.panel.height) || manifest.panel.height < 160 || manifest.panel.height > 900) fail('Invalid panel bounds');
        if (!array(manifest.parameters) || !array(manifest.widgets) || manifest.parameters.length > 256 || manifest.widgets.length > 256) fail('Invalid parameter/widget lists');
        var seen = {}, widgets = {}, i, p, w;
        function has(o,k) { return Object.prototype.hasOwnProperty.call(o,'$'+k); }
        for (i = 0; i < manifest.parameters.length; i++) {
            p = manifest.parameters[i];keys(p,['id','name','min','max','defaultValue','unit','evidence']);
            if (!text(p.id) || !text(p.name) || has(seen,p.id) || !finite(p.min) || !finite(p.max) || p.min >= p.max || Math.abs(p.min)>1e9 || Math.abs(p.max)>1e9 || !finite(p.defaultValue) || p.defaultValue<p.min || p.defaultValue>p.max || typeof p.unit !== 'string' || p.unit.length>32 || ['synthetic','user-reported','host-captured'].indexOf(p.evidence)<0) fail('Invalid parameter');
            if(p.evidence==='synthetic' && !manifest.demoOnly)fail('Synthetic parameters cannot enable real binding');
            seen['$'+p.id]=p;
        }
        var designs=['studio','graphite','silver','selector','halo','stepped','pointer','recessed','gloss','monitor'];
        for(i=0;i<manifest.widgets.length;i++) {
            w=manifest.widgets[i];keys(w,['id','parameterId','label','x','y','width','height','design','accent','stepCount','stepValues']);
            if(!text(w.id)||!text(w.label)||!text(w.parameterId)||has(widgets,w.id)||!has(seen,w.parameterId)||designs.indexOf(w.design)<0||['mint','amber','cyan','red'].indexOf(w.accent)<0)fail('Invalid widget identity or appearance');
            p=seen['$'+w.parameterId];
            if(!finite(w.x)||!finite(w.y)||!finite(w.width)||!finite(w.height)||w.width<96||w.height<110||w.x<0||w.y<0||w.x+w.width>manifest.panel.width||w.y+w.height>manifest.panel.height)fail('Widget exceeds panel');
            if(!finite(w.stepCount)||w.stepCount%1||w.stepCount<0||w.stepCount===1||w.stepCount>128||!array(w.stepValues)||w.stepValues.length===1||w.stepValues.length>128||(w.stepCount&&w.stepValues.length))fail('Invalid detent configuration');
            for(var j=0;j<w.stepValues.length;j++)if(!finite(w.stepValues[j])||w.stepValues[j]<p.min||w.stepValues[j]>p.max||(j&&w.stepValues[j]<=w.stepValues[j-1]))fail('Invalid custom detents');
            widgets['$'+w.id]=true;
        }
        if(Object.prototype.hasOwnProperty.call(manifest,'connections')){if(!array(manifest.connections)||manifest.connections.length>256)fail('Invalid connections');var connectionIds={};for(i=0;i<manifest.connections.length;i++){var c=manifest.connections[i];keys(c,['id','kind','fromWidgetId','toWidgetId','accent','slack']);if(!text(c.id)||has(connectionIds,c.id)||c.kind!=='visual'||c.fromWidgetId===c.toWidgetId||!has(widgets,c.fromWidgetId)||!has(widgets,c.toWidgetId)||['mint','amber','cyan','red'].indexOf(c.accent)<0||!finite(c.slack)||c.slack<0||c.slack>120)fail('Invalid visual connection');connectionIds['$'+c.id]=true;}}
        return manifest;
    }
    function parse(source) { if(typeof source!=='string'||source.length>1000000)fail('Manifest exceeds 1 MB');return validate(JSON.parse(source)); }
    function parameter(manifest,id) { for(var i=0;i<manifest.parameters.length;i++)if(manifest.parameters[i].id===id)return manifest.parameters[i];fail('Unknown parameter'); }
    function stops(widget,p) { var result=widget.stepValues.slice();if(!result.length&&widget.stepCount)for(var i=0;i<widget.stepCount;i++)result.push(p.min+(p.max-p.min)*i/(widget.stepCount-1));return result; }
    function clamp(value,min,max) { if(!finite(value))fail('Nonfinite value');return Math.max(min,Math.min(max,value)); }
    function snap(value,p,widget) { value=clamp(value,p.min,p.max);var values=stops(widget,p),best=value;if(values.length){best=values[0];for(var i=1;i<values.length;i++)if(Math.abs(values[i]-value)<Math.abs(best-value))best=values[i];}return best; }
    function position(value,p,w) { var values=stops(w,p);return values.length?values.indexOf(snap(value,p,w))/(values.length-1):(clamp(value,p.min,p.max)-p.min)/(p.max-p.min); }
    function at(position,p,w) { position=clamp(position,0,1);var values=stops(w,p);return values.length?values[Math.round(position*(values.length-1))]:p.min+position*(p.max-p.min); }
    function normalizedName(value) { return String(value).replace(/^\s+|\s+$/g,'').toLowerCase(); }
    function matches(p,host) { return normalizedName(p.name)===normalizedName(host.name)&&Math.abs(p.min-host.min)<1e-7&&Math.abs(p.max-host.max)<1e-7; }
    function connectionGeometry(project,c){
        var a,b;for(var i=0;i<project.widgets.length;i++){if(project.widgets[i].id===c.fromWidgetId)a=project.widgets[i];if(project.widgets[i].id===c.toWidgetId)b=project.widgets[i];}
        var dx=b.x+b.width/2-a.x-a.width/2,dy=b.y+b.height/2-a.y-a.height/2,horizontal=Math.abs(dx)>=Math.abs(dy),direction=(horizontal?dx:dy)>=0?1:-1;
        var start=horizontal?{x:a.x+(direction>0?a.width:0),y:a.y+a.height/2}:{x:a.x+a.width/2,y:a.y+(direction>0?a.height:0)};
        var end=horizontal?{x:b.x+(direction>0?0:b.width),y:b.y+b.height/2}:{x:b.x+b.width/2,y:b.y+(direction>0?0:b.height)};
        var reach=Math.max(4,Math.abs(horizontal?end.x-start.x:end.y-start.y)*.4);
        function point(p){return {x:Math.max(0,Math.min(project.panel.width,p.x)),y:Math.max(0,Math.min(project.panel.height,p.y))};}
        var c1=point(horizontal?{x:start.x+direction*reach,y:start.y+c.slack}:{x:start.x+c.slack,y:start.y+direction*reach});
        var c2=point(horizontal?{x:end.x-direction*reach,y:end.y+c.slack}:{x:end.x+c.slack,y:end.y-direction*reach});return {start:start,end:end,c1:c1,c2:c2};
    }
    return {validate:validate,parse:parse,parameter:parameter,stops:stops,snap:snap,position:position,at:at,clamp:clamp,matches:matches,normalizedName:normalizedName,connectionGeometry:connectionGeometry};
}());
