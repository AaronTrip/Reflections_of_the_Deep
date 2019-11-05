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


function soundEffect(sound)
{
    play(sound);
}

function backgroundMusic(sound)
{
    setLoop(true);
    play(sound);
}




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
        this.content_sequence = this.createContentSequence(content); //array of tokenized content (stuff between {})
        this.inventory_index = inventory_index;
    }

    isValid(playerInv, roomInv, globalInv) {
        //check inventories
        var i=0;
        while (i < 3) {
            var inv;
            switch(i) {
                case 1:
                    inv = playerInv;
                case 2:
                    inv = roomInv;
                case 3:
                    inv = globalInv;
                default:
                    break;
            }
            for (cond in this.conditionals[i]) {
                if (!(cond in inv)) {
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

// Janky ass software crossbar thing mashed together with an on the fly state machine
// to handle the interconnect between the clock tick and what actions need to be made.
// This allows somewhat smooth handling of actions when using a somewhat regular clock
// tick as well handling the linking of actions with their definitions
class ActionQueue
{
    constructor(parser)
    {
        this.parser = parser;
        this.queue = [];
        this.display_string = undefined;
        this.timer = undefined;
    }

    push(content)
    {
        if(this.queue.length == 0)
        {
            this.queue.push(content);
            this.next();
        } else
        {
            this.queue.push(content);
        }
    }

    next()
    {
        if(this.queue.length > 0)
            this.queue = this.queue.slice(1, this.queue.length);

        // Stop if empty
        if(this.queue.length == 0)
            return;

        switch(this.queue[0].type)
        {
            case tok_type.STRING:
            console.log("Found a print string");
            //call print function on token.string
            this.display_string = new StringClass(token.string, 200, 0, 800);
            break;

            case tok_type.BREAK:
            console.log("Found a call break");
            // We don't need to do anything here
            break;

            case tok_type.DELAY:
            console.log("Found a call delay");

            //execute delay (make sure this doesn't interfere with sound)
            this.timer = Math.floor(millis()) + parseInt(this.queue[0].string);  // ms
            break;

            case tok_type.SFX:
            console.log("Found a call SFX");

            //play SFX (file path given by token.string)
            loadSound(this.queue[0].string, soundEffect);
            break;

            case tok_type.BGM:
            console.log("Found a call BGM");

            //play BGM (file path given by token.string)
            loadSound(this.queue[0].string, backgroundMusic);
            break;

            case tok_type.INV_MOD:
            console.log("Found a edit inventory");

            //check which type of inventory mod it is by counting the +/-
            //modify inventory accordingly
            //use this.room_inventories[this.current_room.inventory_index] to access current room inventory
            // TODO need access to the parser
            inventory = this.parser.room_inventories[this.parser.current_room.inventory_index];
            var inventory_num = (this.qeueu[0].string.match(/+/g) || []).length;
            var offset = 0;
            if(this.queue[0].string.match("\+"))
                offset = 3;

            switch(inventory_num + offset)
            {
                case 1:  // -
                break;

                case 2:  // --
                break;

                case 3:  // ---
                break;

                case 4:  // +
                break;

                case 5:  // ++
                break;

                case 6:  // +++
                break;

                default:
                console.warn("Uh oh spagatio");
            }
            break;

            case tok_type.LINK:
            console.log("Found a link to room");

            //changed current room
            // TODO the current room needs to be changed
            // Abort everything that we are currently planning on doing
            this.queue = [];
            break;

            default:
            console.warn("Found a Invalid token in ActionQueue");
            break;
        }

    }

    run()
    {
        // Do nothing if queue is empty
        if(this.queue[0].length == 0)
            return;

        switch(this.queue.type)
        {
            case tok_type.STRING:
            console.log("Running print string");
            this.display_string.oprint();

            // Check if the printing is over, move to the next item if it is
            if(true)
                this.next();
            break;

            case tok_type.BREAK:
            console.log("Running call break");

            // Stall and wait for an interrupt (do nothing)
            break;

            case tok_type.DELAY:
            console.log("Running call delay");

            // Check to see if the appropriot amount of time has passed
            if(Math.floor.millis() >= this.timer)
                this.next();
            break;

            case tok_type.SFX:
            console.log("Running call SFX");

            // The callback has already been initated so we can continue
            this.next();
            break;

            case tok_type.BGM:
            console.log("Running call BGM");

            // The callback has already been initated so we can continue
            this.next();
            break;

            case tok_type.INV_MOD:
            console.log("Running edit inventory");

            // Only takes one tick to complete, so continue
            this.next();
            break;

            case tok_type.LINK:
            // We should never reach this point
            console.warn("linking to a new room, that is bad");
            break;

            default:
            console.warn("Running invalid token in ActionQueue");
            break;
        }
    }

    interupt()
    {
        switch(this.queue.type)
        {
            case tok_type.STRING:
            console.log("Interrupting print string");

            // TODO shortcut the typing text to immediately show everything
            this.display_string.oprint();
            this.next();
            break;

            case tok_type.BREAK:
            console.log("Interrupting call break");

            // We are now done waiting
            this.next()
            break;

            case tok_type.DELAY:
            console.log("Interrupting call delay");

            // Skip the delay
            this.next();
            break;

            case tok_type.SFX:
            console.log("Interrupting call SFX");

            // We cannot really interrupt the sound effects, they just kinda run
            // on there own, so if we hit this just go to the next thing
            this.next();
            break;

            case tok_type.BGM:
            //play BGM (file path given by token.string)
            console.log("Interrupting call BGM");

            // We cannot really interrupt the background audio, it just kinda runs
            // on its own, so if we hit this just go to the next thing
            this.next();
            break;

            case tok_type.INV_MOD:
            console.log("Interrupting edit inventory");

            // This only takes one tick to complete, so just continue anyways
            this.next();
            break;

            case tok_type.LINK:
            // We should never reach this point
            console.warn("Interrupting the linking to a new room, that is bad");
            break;

            default:
            console.warn("Interrupting invalid token in ActionQueue");
            break;
        }
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
        var tag_indexes = []; //array of array of indexes of each TAGS type
        //find the indexes of every tag
        for (tag in TAGS) {
            var tag_list = [];
            var index = 0;
            while (index < this.corpus.length) {
                var found_index = this.corpus.indexOf(tag,index);
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
                var name = tag_info_string.match("\[.*?\]")[0]; //check this regular expression!
                var conditionals = findConditionals(tag_info_string);
                var content = this.corpus.slice(this.corpus.indexOf("{",index)+1, this.corpus.indexOf("}",index));
                var tag;
                if (TAGS[i] == "ROOM" && !this.rooms.has(name)) { //need to check if room already exists!-- use set
                    this.rooms.add(name);
                    tag = new Tag(type,name,conditionals,content,this.room_inventories.length-1);
                } else if (TAGS[i] == "ROOM") {
                    tag = new Tag(type,name,conditionals,content,this.room_inventories.length-1);
                } else {
                    tag = new Tag(type,name,conditionals,content);
                }
                tag_objects.push(tag);
                console.log("NAME="+tag.name+"CONTENT="+ content + "\n\n");
            }
            this.tags.push(tag_objects);
            ++i;
        }
    }
    findConditionals(string) { //use grouping to get rid of brackets in conditionals -- make sure is greedy
        var conditionals = [];
        if (string.match("\$.*?\$") != null) {
            conditionals.push(string.match("\$.*?\$"));
        } else {
            conditionals.push([]);
        }
        if (string.match("\&.*?\&") != null) {
            conditionals.push(string.match("\&.*?\&"));
        } else {
            conditionals.push([]);
        }
        if (string.match("\%.*?\%") != null) {
            conditionals.push(string.match("\%.*?\%"));
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
