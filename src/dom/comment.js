/**
 * @class  Comment 
 *      This represents the content of a comment, i.e., all the 
 *      characters between the starting '<!--' and ending '-->'
 * @extends CharacterData
 * @author Jon van Noort (jon@webarcana.com.au)
 * @param  ownerDocument :  The Document object associated with this node.
 */
Comment = function(ownerDocument) {
  this.CharacterData  = CharacterData;
  this.CharacterData(ownerDocument);
  this.nodeName  = "#comment";
};
Comment.prototype = new CharacterData;
__extend__(Comment.prototype, {
    get localName(){
        return null;
    },
    get nodeType(){
        return Node.COMMENT_NODE;
    },
    get xml(){
        return "<!--" + this.nodeValue + "-->";
    },
    toString : function(){
        return "[object Comment]";
    }
});

