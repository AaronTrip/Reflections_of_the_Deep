const TAGS = ["EXAMINE", "USE", "TALK", "GO", "TAKE", "ROOM", "YES", "NO"];
const TEXT_MODIFIERS = ["BREAK", "DELAY"];

const tok_type = {
    NULL:       0,
    STRING:     1,
    BREAK:      2,
    DELAY:      3,
    SFX:        4,
    BGM:        5,
    INV_MOD:    6,
    LINK:       7
};

//where to set initial room?

class Token
{
    constructor(string, type)
    {
        this.string = string;
        this.type = type;
    }
}

class Tag {
    constructor(type, name, conditionals, content,inventory_index=null) {
        this.type = type;
        this.name = name;
        this.conditionals = conditionals;
        this.conditional_count = conditionals.length;
        this.content_sequence = createContentSequence(content); //array of tokenized content (stuff between {})
        this.inventory_index = inventory_index;
    }
    isValid(playerInv, roomInv, globalInv) {
        //check inventories
        var i=0;
        while (i < 3) {
            var inv;
            switch(i) {
                case 1:
                    var inv = playerInv;
                case 2:
                    var inv = roomInv;
                case 3:
                    var inv = globalInv;
                default:
                    break;
            }
            for (cond in this.conditionals[i]) {
                if (cond not in inv) {
                    return false;
                }
            }
        }
        return true;
    }
    createContentSequence(content) {
        //chop content (everything inside the {}) into a series of tokens
        tokens = [];
        var i = 0;
        while (i < content.length) {
            current_char = content[i];
            current_string = "";
            switch(current_char) {
                case "*": //is a SFX
                    if (current_string) {
                        tokens.push(new Token(current_string,tok_type.STRING));
                        current_string = "";
                    }
                    var token_str = content.slice(i+1,indexOf("*",i+1));
                    tokens.push(new Token(token_str,tok_type.SFX));
                    break;
                case "<": //is a BGM
                    if (current_string) {
                        tokens.push(new Token(current_string,tok_type.STRING));
                        current_string = "";
                    }
                    var token_str = content.slice(i+1,indexOf(">",i+1));
                    tokens.push(new Token(token_str,tok_type.BGM));
                    break;
                case "[": //is a link
                    if (current_string) {
                        tokens.push(new Token(current_string,tok_type.STRING));
                        current_string = "";
                    }
                    var token_str = content.slice(i+2,indexOf("]",i+1));
                    tokens.push(new Token(token_str,tok_type.LINK));
                    break;
                case "^": //is an inventory mod
                    if (current_string) {
                        tokens.push(new Token(current_string,tok_type.STRING));
                        current_string = "";
                    }
                    var token_str = content.slice(i+1,indexOf("^",i+1));
                    tokens.push(new Token(token_str,tok_type.INV_MOD));
                    break;
                case "|": //is a BREAK or DELAY (bad hardcoding alert!)
                    if (current_string) {
                        tokens.push(new Token(current_string,tok_type.STRING));
                        current_string = "";
                    }
                    if (content[i+1] == "B") {
                        tokens.push(new Token("",tok_type.BREAK));
                    } else if (content[i+1] == "D") {
                        var token_str = content.slice(content.indexOf(" ",i+1),content.indexOf("|",i+1)); //get ms of delay
                        tokens.push(new Token(token_str,tok_type.DELAY));
                    }
                    break;
                default: //is a string
                    current_string += current_char;
                    break;
            }
            ++i;
        }
        return tokens;
    }
}

class Parser {
    constructor(corpus, player_inventory, global_inventory) { //add queue of tokens to run
        console.log(corpus);
        this.corpus = corpus;
        this.player_inventory = player_inventory;
        this.global_inventory = global_inventory;
        this.rooms = new Set(); //store room tags here as a set of names 
        this.current_room = null;
        this.room_inventories = []; //array of room inventories
        this.tags = []; //[EXAMINE[], USE[], TALK[], ...]
    }
    chopIntoTags() {
        tag_indexes = []; //array of array of indexes of each TAGS type
        //find the indexes of every tag
        for (tag in TAGS) {
            var tag_list = [];
            var index = 0;
            while (index < this.corpus.length) {
                found_index = this.corpus.indexOf(tag,index);
                if (found_index < -1) {
                    break;
                }
                tag_list.push(found_index);
                index = found_index;
            }
            tag_indexes.push(tag_list);
        }
        //iterate though all the tag indexes, turning them into Tag objects
        var i = 0;
        while (i < tag_indexes.length) {
            var tag_objects = [];
            for (index in tag_indexes[i]) {
                var type = TAGS[i];
                var tag_info_string = this.corpus.slice(index,this.corpus.indexOf("{"));
                var name = tag_info_string.match(\[.*?\])[0]; //check this regular expression!
                var conditionals = findConditionals(tag_info_string);
                var content = this.corpus.slice(this.corpus.indexOf("{",index)+1, this.corpus.indexOf("}",index));
                if (TAGS[i] == "ROOM" && !this.rooms.has(name)) { //need to check if room already exists!-- use set
                    this.rooms.add(name);
                    var tag = new Tag(type,name,conditionals,content,this.room_inventories.length-1);
                    tag_objects.push(tag);
                } else {
                    var tag = new Tag(type,name,conditionals,content);
                    tag_objects.push(tag);
                }
            }
            this.tags.push(tag_objects);
        }
    }
    findConditionals(string) { //use grouping to get rid of brackets in conditionals -- make sure is greedy 
        var conditionals = [];
        if (string.match(\$.*\$) != null) {
            conditionals.push(string.match(\$.*\$));
        } else {
            conditionals.push([]);
        }
        if (string.match(\&.*\&) != null) {
            conditionals.push(string.match(\&.*\&));
        } else {
            conditionals.push([]);
        }
        if (string.match(\%.*\%) != null) {
            conditionals.push(string.match(\%.*\%))
        } else {
            conditionals.push([]);
        }
        return conditionals;                  
    }
    contentSequenceHandler(token_list) {//not used
        for (token in token_list) {
            console.log("TOKEN.STRING="+token.string);
            switch(token.type) {
                case tok_type.STRING:
                    //call print function on token.string
                    display_string = new StringClass(token.string, 200, 0, 800);
                    display_string.oprint();
                    console.log("print string");
                    break;
                case tok_type.BREAK:
                    //call break function
                    console.log("call break");
                    break;
                case tok_type.DELAY:
                    //execute delay (make sure this doesn't interfere with sound)
                    console.log("call delay");
                    break;
                case tok_type.SFX:
                    //play SFX (file path given by token.string)
                    console.log("call SFX");
                    break;
                case tok_type.BGM:
                    //play BGM (file path given by token.string)
                    console.log("call BGM");
                    break;
                case tok_type.INV_MOD:
                    //check which type of inventory mod it is by counting the +/- 
                    //modify inventory accordingly 
                    //use this.room_inventories[this.current_room.inventory_index] to access current room inventory
                    console.log("edit inventory");
                    break;
                case tok_type.LINK:
                    //changed current room
                    console.log("link to room");
                    break;
                default:
                    console.warn("Invalid token in contentSequenceHandler");
                    break;
            }
        }
    }
    query(action,name) {
        
    }
}