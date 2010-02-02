
/*
 * Envjs rhino-env.1.2.0.0 
 * Pure JavaScript Browser Environment
 * By John Resig <http://ejohn.org/> and the Envjs Team
 * Copyright 2008-2010 John Resig, under the MIT License
 */

(function(){





/**
 * Writes message to system out
 * @param {Object} message
 */
Envjs.log = function(message){
    print(message);
};

Envjs.lineSource = function(e){
    return e&&e.rhinoException?e.rhinoException.lineSource():"(line ?)";
};

/**
 * Rhino provides a very succinct 'sync'
 * @param {Function} fn
 */
Envjs.sync = sync;


/**
 * sleep thread for specified duration
 * @param {Object} millseconds
 */
Envjs.sleep = function(millseconds){
    java.lang.Thread.currentThread().sleep(millseconds);
};

/**
 * resolves location relative to doc location
 * @param {Object} path
 * @param {Object} path
 * @param {Object} base
 */
Envjs.location = function(path, base){
    var protocol = new RegExp('(^file\:|^http\:|^https\:)'),
        m = protocol.exec(path),
        baseURI;
    if(m&&m.length>1){
        return (new java.net.URL(path).toString()+'')
            .replace('file:/', 'file:///');;
    }else if(base){
        return (new java.net.URL(new java.net.URL(base), path)+'')
            .replace('file:/', 'file:///');;
    }else{
        //return an absolute url from a url relative to the window location
        //TODO: window should not be inlined here. this should be passed as a 
        //      parameter to Envjs.location :DONE
        if(document){
            baseURI = document.baseURI;
            if(baseURI == 'about:blank'){
                baseURI = (java.io.File(path).toURL().toString()+'')
                        .replace('file:/', 'file:///');
                //console.log('baseURI %s', baseURI);
                return baseURI;
            }else{
                base = baseURI.substring(0, baseURI.lastIndexOf('/'));
                if(base.length > 0){
                    return base + '/' + path;
                }else{
                    return (new java.io.File(path).toURL().toString()+'')
                        .replace('file:/', 'file:///');
                }
            }
        }else{
            return (new java.io.File(path).toURL().toString()+'')
                        .replace('file:/', 'file:///');
        }
    }
};

/**
 * 
 * @param {Object} fn
 * @param {Object} onInterupt
 */
Envjs.runAsync = function(fn, onInterupt){
    ////Envjs.debug("running async");
    var running = true,
        run = sync(function(){ 
        //while happening only thing in this timer    
        ////Envjs.debug("running timed function");
        fn();
    });
    
    try{
        spawn(run);
    }catch(e){
        //Envjs.error("error while running async", e);
        if(onInterrupt)
            onInterrupt(e);
    }
};

/**
 * Used to write to a local file
 * @param {Object} text
 * @param {Object} url
 */
Envjs.writeToFile = function(text, url){
    //Envjs.debug("writing text to url : " + url);
    var out = new java.io.FileWriter( 
        new java.io.File( 
            new java.net.URI(url.toString()))); 
    out.write( text, 0, text.length );
    out.flush();
    out.close();
};
    
/**
 * Used to write to a local file
 * @param {Object} text
 * @param {Object} suffix
 */
Envjs.writeToTempFile = function(text, suffix){
    //Envjs.debug("writing text to temp url : " + suffix);
    // Create temp file.
    var temp = java.io.File.createTempFile("envjs-tmp", suffix);

    // Delete temp file when program exits.
    temp.deleteOnExit();

    // Write to temp file
    var out = new java.io.FileWriter(temp);
    out.write(text, 0, text.length);
    out.close();
    return temp.getAbsolutePath().toString()+'';
};
    

/**
 * Used to delete a local file
 * @param {Object} url
 */
Envjs.deleteFile = function(url){
    var file = new java.io.File( new java.net.URI( url ) );
    file["delete"]();
};
    
/**
 * establishes connection and calls responsehandler
 * @param {Object} xhr
 * @param {Object} responseHandler
 * @param {Object} data
 */
Envjs.connection = function(xhr, responseHandler, data){
    var url = java.net.URL(xhr.url),
        connection;
    if ( /^file\:/.test(url) ) {
        try{
            if ( xhr.method == "PUT" ) {
                var text =  data || "" ;
                Envjs.writeToFile(text, url);
            } else if ( xhr.method == "DELETE" ) {
                Envjs.deleteFile(url);
            } else {
                connection = url.openConnection();
                connection.connect();
                //try to add some canned headers that make sense
                
                try{
                    if(xhr.url.match(/html$/)){
                        xhr.responseHeaders["Content-Type"] = 'text/html';
                    }else if(xhr.url.match(/.xml$/)){
                        xhr.responseHeaders["Content-Type"] = 'text/xml';
                    }else if(xhr.url.match(/.js$/)){
                        xhr.responseHeaders["Content-Type"] = 'text/javascript';
                    }else if(xhr.url.match(/.json$/)){
                        xhr.responseHeaders["Content-Type"] = 'application/json';
                    }else{
                        xhr.responseHeaders["Content-Type"] = 'text/plain';
                    }
                //xhr.responseHeaders['Last-Modified'] = connection.getLastModified();
                //xhr.responseHeaders['Content-Length'] = headerValue+'';
                //xhr.responseHeaders['Date'] = new Date()+'';*/
                }catch(e){
                    console.log('failed to load response headers',e);
                }
            }
        }catch(e){
            console.log('failed to open file %s %s', url, e);
            connection = null;
            xhr.readyState = 4;
            xhr.statusText = "Local File Protocol Error";
            xhr.responseText = "<html><head/><body><p>"+ e+ "</p></body></html>";
        }
    } else { 
        connection = url.openConnection();
        connection.setRequestMethod( xhr.method );
        
        // Add headers to Java connection
        for (var header in xhr.headers){
            connection.addRequestProperty(header+'', xhr.headers[header]+'');
        }
        
        //write data to output stream if required
        if(data&&data.length&&data.length>0){
             if ( xhr.method == "PUT" || xhr.method == "POST" ) {
                connection.setDoOutput(true);
                var outstream = connection.getOutputStream(),
                    outbuffer = new java.lang.String(data).getBytes('UTF-8');
                
                outstream.write(outbuffer, 0, outbuffer.length);
                outstream.close();
            }
        }else{
            connection.connect();
        }
    }
    
    if(connection){
        try{
            var respheadlength = connection.getHeaderFields().size();
            // Stick the response headers into responseHeaders
            for (var i = 0; i < respheadlength; i++) { 
                var headerName = connection.getHeaderFieldKey(i); 
                var headerValue = connection.getHeaderField(i); 
                if (headerName)
                    xhr.responseHeaders[headerName+''] = headerValue+'';
            }
        }catch(e){
            Envjs.error('failed to load response headers',e);
        }
        
        xhr.readyState = 4;
        xhr.status = parseInt(connection.responseCode,10) || undefined;
        xhr.statusText = connection.responseMessage || "";
        
        var contentEncoding = connection.getContentEncoding() || "utf-8",
            baos = new java.io.ByteArrayOutputStream(),
            buffer = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, 1024),
            length,
            stream = null,
            responseXML = null;

        try{
            stream = (contentEncoding.equalsIgnoreCase("gzip") || 
                      contentEncoding.equalsIgnoreCase("decompress") )?
                new java.util.zip.GZIPInputStream(connection.getInputStream()) :
                connection.getInputStream();
        }catch(e){
            if (connection.getResponseCode() == 404){
                console.log('failed to open connection stream \n %s %s',
                          e.toString(), e);
            }else{
                console.log('failed to open connection stream \n %s %s',
                           e.toString(), e);
            }
            stream = connection.getErrorStream();
        }
        
        while ((length = stream.read(buffer)) != -1) {
            baos.write(buffer, 0, length);
        }

        baos.close();
        stream.close();

        xhr.responseText = java.nio.charset.Charset.forName("UTF-8").
            decode(java.nio.ByteBuffer.wrap(baos.toByteArray())).toString()+"";
            
    }
    if(responseHandler){
        //Envjs.debug('calling ajax response handler');
        responseHandler();
    }
};

//Since we're running in rhino I guess we can safely assume
//java is 'enabled'.  I'm sure this requires more thought
//than I've given it here
Envjs.javaEnabled = true;   

Envjs.tmpdir         = java.lang.System.getProperty("java.io.tmpdir"); 
Envjs.os_name        = java.lang.System.getProperty("os.name"); 
Envjs.os_arch        = java.lang.System.getProperty("os.arch"); 
Envjs.os_version     = java.lang.System.getProperty("os.version"); 
Envjs.lang           = java.lang.System.getProperty("user.lang"); 
Envjs.platform       = "Rhino ";//how do we get the version
    
/**
 * Makes an object window-like by proxying object accessors
 * @param {Object} scope
 * @param {Object} parent
 */
Envjs.proxy = function(scope, parent){

    var _scope = scope;
        _parent = parent||null,
        _this = this,
        _undefined = undefined,
        _proxy = new Packages.org.mozilla.javascript.ScriptableObject({
            getClassName: function(){
                return 'envjs.platform.rhino.Proxy';
            },
            has: function(nameOrIndex, start){
                var has;
                //print('proxy has '+nameOrIndex+" ("+nameOrIndex['class']+")");
                if(nameOrIndex['class'] == java.lang.String){
                    switch(nameOrIndex+''){
                        case '__iterator__':
                            return _proxy.__iterator__;
                            break;
                        default:
                            has = (nameOrIndex+'') in _scope;
                            //print('has as string :'+has);
                            return has;
                    }
                }else if(nameOrIndex['class'] == java.lang.Integer){
                    has = Number(nameOrIndex+'') in _scope;
                    //print('has as index :'+has);
                    return has;
                }else{
                    //print('has not');
                    return false;
                }
            },
            put: function(nameOrIndex,  start,  value){
                //print('proxy put '+nameOrIndex+" = "+value+" ("+nameOrIndex['class']+")");
                if(nameOrIndex['class'] == java.lang.String){
                    //print("put as string");
                    _scope[nameOrIndex+''] = value;
                }else if(nameOrIndex['class'] == java.lang.Integer){
                    //print("put as index");
                    _scope[Number(nameOrIndex+'')] = value;
                }else{
                    //print('put not');
                    return _undefined;
                }
            },
            get: function(nameOrIndex, start){
                //print('proxy get '+nameOrIndex+" ("+nameOrIndex['class']+")");
                if(nameOrIndex['class'] == java.lang.String){
                    //print("get as string");
                    return  _scope[nameOrIndex+''];
                }else if(nameOrIndex['class'] == java.lang.Integer){
                    //print("get as index");
                    return _scope[Number(nameOrIndex+'')];
                }else{
                    //print('get not');
                    return _undefined;
                }
            },
            'delete': function(nameOrIndex){
                _scope['delete'](nameOrIndex);
            },
            get parentScope(){
                return _parent;
            },
            set parentScope(parent){
                _parent = parent;
            },
            get topLevelScope(){
                return _scope;
            },
            equivalentValues: function(value){
                return (value == _scope || value == this );
            },
            equals: function(value){
                return (value === _scope || value === this );
            }
        });
    
    return _proxy;
};

/**
 * @author john resig & the envjs team
 * @uri http://www.envjs.com/
 * @copyright 2008-2010
 * @license MIT
 */

})();
