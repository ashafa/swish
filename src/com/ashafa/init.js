var swish = {};

(function(){
      
    function domToObj(dom, includeChildren) {
        if(!dom){ return null; }
        var tmpObj = {};
        var xroot = (dom.nodeType == 9)?dom.documentElement:dom;
        if(dom.nodeType == 3 || dom.nodeType == 4) {
            return dom.nodeValue;
        }
        //Set Object Nodes
        function setObjects(obj, node) {
            var elemName;
            var cnode;
            var tObj;
            var cName = "";
            if(!node) { return null; }
            //Set node attributes if any
            if(node.attributes.length > 0){setAttributes(obj, node);}
            obj._text = "";
            if(node.hasChildNodes()) {
                var nodeCount = node.childNodes.length - 1;
                var n = 0;
                do { //Order is irrelevant (speed-up)
                    cnode = node.childNodes[n];
                    switch(cnode.nodeType) {
                    case 1: //Node
                        var tObj = {}, cObj = {};
                        tObj[formatName(cnode.nodeName)] = cObj;
                        if(includeChildren){
                            //Process child nodes
                            if(!obj._children){
                                obj._children = [];
                            }
                            obj._children.push(tObj);
                            if(cnode.hasChildNodes()) {
                                setObjects(cObj, cnode); //Recursive Call
                            }
                        }
                        setAttributes(cObj, cnode);
                        break;
                    case 3: //Text Value
                        if(!obj._text){
                            setTextContent(obj, cnode);
                        }
                        break;
                    case 4: //CDATA
                        if(!obj._cdata){
                            obj._cdata = [];
                        }
                        obj._cdata.push(cnode.text||cnode.nodeValue);
                        break;
                    }
                } while(n++ < nodeCount);
            }
        }
        
        //Set Text of an object
        function setTextContent(obj, node){
            obj._text = nav(node.parentNode.childNodes);
            function nav(nodes){
                var str = "";
                for(var i = 0; i < nodes.length; i++){
                    if(nodes[i].nodeType == 3){
                        str += nodes[i].nodeValue;
                    }else if(nodes[i].nodeType == 1){
                        str += nav(nodes[i].childNodes);
                    }
                }
                return str;
            }
        }    
        //Set Attributes of an object
        function setAttributes(obj, node) {
            if(node.attributes.length > 0) {
                var a = node.attributes.length-1;
                var attName;
                obj._attributes = {};
                do { //Order is irrelevant (speed-up)
                    attName = formatName(String(node.attributes[a].name));
                    obj._attributes[attName] = String(node.attributes[a].value);
                } while(a--);
            }
        }
        //Alters attribute and collection names to comply with JS
        function formatName(name) {
            var regEx = /-/g;
            var tName = String(name).replace(regEx,"_");
            return tName.toLowerCase();
        }
        var isNumeric = function(s) {
            var testStr = "";
            if(s && typeof s == "string") { testStr = s; }
            var pattern = /^((-)?([0-9]*)((\.{0,1})([0-9]+))?$)/;
            return pattern.test(testStr);
        }
        //RUN
        setObjects(tmpObj, xroot);
        var jsonObj = {};
        jsonObj[formatName(xroot.nodeName)] = tmpObj;
        //Clean-up memmory
        dom = null;
        xroot = null;
        
        return jsonObj;
    }
   
    swish.find = function(url, expr, children){
        var cleaner = new Packages.org.htmlcleaner.HtmlCleaner();
        var props = cleaner.getProperties();
        props.setOmitXmlDeclaration(true);
        props.setAdvancedXmlEscape(false);
        props.setRecognizeUnicodeChars(true);
        props.setTranslateSpecialEntities(false);
        var node = cleaner.clean(new java.net.URL(url), "UTF-8");
        var str = new Packages.org.htmlcleaner.SimpleXmlSerializer(props).getXmlAsString(node);
        $out.println(str);
        window.document.loadXML(str);
        var results =  Sizzle(expr, window.document);
        var items = [];
        for(index in results){
            items.push(domToObj(results[index], children));
        }
        return JSON.stringify({items: items, count: items.length});
    }

})();

function load(file){
    $load.applyTo(Packages.clojure.lang.PersistentVector.create(file).seq());
}

window.document.loadXML('<html />');