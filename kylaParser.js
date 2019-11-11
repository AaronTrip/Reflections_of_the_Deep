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
        //console.log("NEW_TAG="+name);
        //console.log(conditionals);
        this.type = type;
        this.name = name;
        this.conditionals = conditionals;
        this.conditional_count = conditionals.length;
        this.content_sequence = this.createContentSequence(content); //array of tokenized content (stuff between {})
        this.inventory_index = inventory_index;
    }

    isValid(playerInv, roomInv, globalInv) {
        /*
        console.log("playerInv:");
        console.log(playerInv);
        console.log("roomInv:");
        console.log(roomInv);
        console.log("globalInv:");
        console.log(globalInv);
        console.log("tag_conditionals:");
        console.log(this.conditionals);
        */
        var i=0;
        while (i < 3) {
            var inv;
            switch(i) {
                case 0:
                    inv = playerInv;
                    //console.log("set PlaYEr InVEntOrY");
                    break;
                case 1:
                    inv = roomInv;
                    //console.log("sEt rOoM iNVenToRy");
                    break;
                case 2:
                    inv = globalInv;
                    //console.log("SeT GLobAl inVEnToRY");
                    break;
                default:
                    break;
            }
            for(var k = 0; k < this.conditionals[i].length; ++k) {
                //console.log("checked="+i);
                if (!(inv.has(this.conditionals[i][k]))) {
                    return false;
                }
            }
            ++i;
        }
        return true;
    }

    createContentSequence(content) {
        //chop content (everything inside the {}) into a series of tokens
        var tokens = [];
        var i = 0;
        var current_string = "";
        while (i < content.length) {
            var current_char = content[i];
            switch(current_char) {
                case "*": //is a SFX
                    if (current_string && /\S/.test(current_string)) {
                        tokens.push(new Token(current_string,tok_type.STRING));
                        current_string = "";
                    }
                    var token_str = content.slice(i+1,content.indexOf("*",i+1));
                    tokens.push(new Token(token_str,tok_type.SFX));
                    i = content.indexOf("*",i+1);
                    //console.log("NEW_CONTENT_TOKEN(*)="+token_str);
                    break;
                case "<": //is a BGM
                    if (current_string && /\S/.test(current_string)) {
                        tokens.push(new Token(current_string,tok_type.STRING));
                        current_string = "";
                    }
                    var token_str = content.slice(i+1,content.indexOf(">",i+1));
                    tokens.push(new Token(token_str,tok_type.BGM));
                    i = content.indexOf(">",i+1);
                    //console.log("NEW_CONTENT_TOKEN(<)="+token_str);
                    break;
                case "[": //is a link
                    if (current_string && /\S/.test(current_string)) {
                        tokens.push(new Token(current_string,tok_type.STRING));
                        current_string = "";
                    }
                    var token_str = content.slice(i+2,content.indexOf("]",i+1));
                    tokens.push(new Token(token_str,tok_type.LINK));
                    i = content.indexOf("]",i+1);
                    //console.log("NEW_CONTENT_TOKEN([)="+token_str);
                    break;
                case "^": //is an inventory mod
                    if (current_string && /\S/.test(current_string)) {
                        tokens.push(new Token(current_string,tok_type.STRING));
                        current_string = "";
                    }
                    var token_str = content.slice(i+1,content.indexOf("^",i+1));
                    tokens.push(new Token(token_str,tok_type.INV_MOD));
                    //console.log("HAT BOI="+token_str);
                    i = content.indexOf("^",i+1);
                    //console.log("NEW_CONTENT_TOKEN(^)="+token_str);
                    break;
                case "|": //is a BREAK or DELAY (bad hardcoding alert!)
                    if (current_string && /\S/.test(current_string)) {
                        tokens.push(new Token(current_string,tok_type.STRING));
                        current_string = "";
                    }
                    if (content[i+1] == "B") {
                        tokens.push(new Token("",tok_type.BREAK));
                    } else if (content[i+1] == "D") {
                        var token_str = content.slice(content.indexOf(" ",i+1),content.indexOf("|",i+1)); //get ms of delay
                        tokens.push(new Token(token_str,tok_type.DELAY));
                    }
                    i = content.indexOf("|",i+1);
                    //console.log("NEW_CONTENT_TOKEN(|)="+token_str);
                    break;
                default: //is a string
                    current_string += current_char;
                    break;
            }
            ++i;
        }
        tokens.push(new Token(current_string,tok_type.STRING));
        //console.log("NEW_CONTENT_TOKEN(str)="+current_string);
        return tokens;
    }
}

// Janky ass software crossbar thing mashed together with an on the fly state machine
// to handle the interconnect between the clock tick and what actions need to be made.
// This allows somewhat smooth handling of actions when using a somewhat regular clock
// tick as well handling the linking of actions with their definitions
class ActionQueue
{
    constructor(parser, sfxFunc, bgFunc)
    {
        this.parser = parser;
        this.sfxFunc = sfxFunc;
        this.bgFunc = bgFunc;
        this.queue = [];
        this.stale = true;
        this.display_string = undefined;
        this.full_string = undefined;
        this.string_pointer = 0;
        this.print_wait = 0;
        this.timer = undefined;
    }

    push(content)
    {
        if(this.queue.length == 0)
        {
            this.stale = true;
            this.queue.push(content);
            this.next();
        } else
        {
            this.queue.push(content);
        }
        console.log("Queue was pushed :(");
        console.log(this.queue);
    }

    next()
    {
        //console.log("Queue was nexted :)");
        if(this.queue.length > 0 && !this.stale)
            this.queue = this.queue.slice(1, this.queue.length);
        this.stale = false;
        // Stop if empty
        if(this.queue.length == 0)
            return;

        //console.log("Queue next type: " + this.queue[0].type);
        switch(this.queue[0].type)
        {
            case tok_type.STRING:
            //console.log("Found a print string");
            //call print function on token.string
            this.full_string = this.queue[0].string;
            this.string_pointer = 0;
            this.display_string = new printClass(this.queue[0].string.slice(0, Math.min(this.string_pointer++, this.full_string.length)), -400,-250,800);
            break;

            case tok_type.BREAK:
            //console.log("Found a call break");
            // We don't need to do anything here
            break;

            case tok_type.DELAY:
            //console.log("Found a call delay");

            //execute delay (make sure this doesn't interfere with sound)
            this.timer = Math.floor(millis()) + parseInt(this.queue[0].string);  // ms
            break;

            case tok_type.SFX:
            //console.log("Found a call SFX");

            //play SFX (file path given by token.string)
            loadSound(this.queue[0].string, this.sfxFunc);
            break;

            case tok_type.BGM:
            //console.log("Found a call BGM");

            //play BGM (file path given by token.string)
            loadSound(this.queue[0].string, this.bgFunc);
            break;

            case tok_type.INV_MOD:
            //console.log("Found a edit inventory");

            //check which type of inventory mod it is by counting the +/-
            //modify inventory accordingly
            //use this.room_inventories[this.current_room.inventory_index] to access current room inventory
            // TODO need access to the parser
            var inventory_num;
            if(this.queue[0].string[2] == "-")
                inventory_num = 3;
            else if(this.queue[0].string[1] == "-")
                inventory_num = 2;
            else if(this.queue[0].string[0] == "-")
                inventory_num = 1;
            else if(this.queue[0].string[2] == "+")
                inventory_num = 6;
            else if(this.queue[0].string[1] == "+")
                inventory_num = 5;
            else if(this.queue[0].string[0] == "+")
                inventory_num = 4;
            else
                console.warn("Error in indexing");
                console.log(this.queue[0]);
                
                
            switch(inventory_num)
            {
                case 1:  // -
                    var inventory = this.parser.player_inventory;
                    var item = this.queue[0].string.slice(1,this.queue[0].string.length);
                    inventory.remove(item);
                break;

                case 2:  // --
                    var inventory = this.parser.room_inventories[this.parser.current_room.inventory_index];
                    var item = this.queue[0].string.slice(2,this.queue[0].string.length);
                    inventory.remove(item);
                break;

                case 3:  // ---
                    var inventory = this.parser.global_inventory;
                    var item = this.queue[0].string.slice(3,this.queue[0].string.length);
                    inventory.remove(item);
                break;

                case 4:  // +
                    var inventory = this.parser.player_inventory;
                    var item = this.queue[0].string.slice(1,this.queue[0].string.length);
                    inventory.add(item);
                break;

                case 5:  // ++
                    var inventory = this.parser.room_inventories[this.parser.current_room.inventory_index];
                    var item = this.queue[0].string.slice(2,this.queue[0].string.length);
                    inventory.add(item);
                break;

                case 6:  // +++
                    var inventory = this.parser.global_inventory;
                    var item = this.queue[0].string.slice(3,this.queue[0].string.length);
                    inventory.add(item);
                break;

                default:
                console.warn("Uh oh spagatio");
            }
                console.log(this.parser.player_inventory,this.parser.room_inventories[this.parser.current_room.inventory_index],this.parser.global_inventory);
            break;

            case tok_type.LINK:
            //console.log("Found a link to room");

            //changed current room
            // TODO the current room needs to be changed
            // Abort everything that we are currently planning on doing
                //this isn't working i think
                var new_room = this.queue[0].string;
                this.queue = [];
                this.parser.query("ROOM", new_room);
            break;

            default:
            console.warn("Found a Invalid token in ActionQueue");
            break;
        }

    }

    run()
    {
        //console.log("Queue was runed >:)");
        // Do nothing if queue is empty
        if(this.display_string)
            {
                //console.log("YES STINRG");
            this.display_string.oprint();
            }
        else
            //console.log("NO STRING");
        
        if(this.queue == [] || this.queue.length == 0)
            return;

        //console.log("Queue type: " + this.queue[0].type);
        switch(this.queue[0].type)
        {
            case tok_type.STRING:
            //console.log("Running print string");
            if(Math.floor(millis()) >= this.print_wait)
            {
                //console.log("Running print string");
                this.display_string = new printClass(this.full_string.slice(0, Math.min(this.string_pointer++, this.full_string.length)), -400,-250,800);
                this.print_wait = Math.floor(millis()) + 5;
            }
                this.display_string.oprint();
            // Check if the printing is over, move to the next item if it is
            if(this.string_pointer-1 >= this.full_string.length)
                {
                    //this.display_string = undefined;
                //this.next();
                }
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
            console.warn("Running invalid token in ActionQueue: " + this.queue[0].type);
            break;
        }

    }

    interupt()
    {
        //console.log("Queue was runed >:)");
        // Do nothing if queue is empty
        if(this.queue == [] || this.queue.length == 0)
            return;
        
        switch(this.queue[0].type)
        {
            case tok_type.STRING:
            //console.log("Interrupting print string");

            // TODO shortcut the typing text to immediately show everything
            this.display_string = new printClass(this.full_string, -400,-250,800);
            this.display_string.oprint();   
            this.next();
            break;

            case tok_type.BREAK:
            //console.log("Interrupting call break");

            // We are now done waiting
            this.next()
            break;

            case tok_type.DELAY:
            //console.log("Interrupting call delay");

            // Skip the delay
            this.next();
            break;

            case tok_type.SFX:
            //console.log("Interrupting call SFX");

            // We cannot really interrupt the sound effects, they just kinda run
            // on there own, so if we hit this just go to the next thing
            this.next();
            break;

            case tok_type.BGM:
            //play BGM (file path given by token.string)
            //console.log("Interrupting call BGM");

            // We cannot really interrupt the background audio, it just kinda runs
            // on its own, so if we hit this just go to the next thing
            this.next();
            break;

            case tok_type.INV_MOD:
            //console.log("Interrupting edit inventory");

            // This only takes one tick to complete, so just continue anyways
            this.next();
            break;

            case tok_type.LINK:
            // We should never reach this point
            //console.warn("Interrupting the linking to a new room, that is bad");
            break;

            default:
            console.warn("Interrupting invalid token in ActionQueue: " + this.queue[0].type + " " + tok_type.STRING);
            break;
        }
    }
}

class Parser {
    constructor(corpus, player_inventory, global_inventory, sfxFunc, bgFunc) { //add queue of tokens to run
        //console.log(corpus);
        this.corpus = corpus;
        this.player_inventory = player_inventory;
        this.global_inventory = global_inventory;
        this.rooms = new Set(); //store room tags here as a set of names
        this.current_room = null;
        this.room_inventories = []; //array of room inventories
        this.tags = []; //[EXAMINE[], USE[], TALK[], ...]
        this.action_queue = new ActionQueue(this, sfxFunc, bgFunc);
    }
    chopIntoTags() {
        var tag_indexes = []; //array of array of indexes of each TAGS type
        //find the indexes of every tag
        //console.log("beginning the indexing");
        for (i in TAGS) {
            var tag = TAGS[i];
            var tag_list = [];
            var index = 0;
            while (index < this.corpus.length) {
                //console.log(tag);
                var found_index = this.corpus.indexOf(tag,index);
                if (found_index == -1) {
                    break;
                }
                tag_list.push(found_index);
                index = found_index+1; //maybe error
                
            }
            tag_indexes.push(tag_list);
        }
        //console.log("successfully made the indexes");
        //iterate though all the tag indexes, turning them into Tag objects
        var i = 0;
        //console.log("beginning the tags");
        while (i < tag_indexes.length) {
            var tag_objects = [];
            var j = 0;
            var index = tag_indexes[i][j];
            while (j < tag_indexes[i].length) {
                var index = tag_indexes[i][j];
                var type = TAGS[i];
                var tag_info_string = this.corpus.slice(index,this.corpus.indexOf("{",index));
                var name = tag_info_string.match(/\[(.*?)\]/)[1]; //check this regular expression!
                var conditionals = this.findConditionals(tag_info_string);
                var content = this.corpus.slice(this.corpus.indexOf("{",index)+1, this.corpus.indexOf("}",index));
                var tag;
                if (type == "ROOM" && name == "init" && this.current_room == null) { //trashy hard code to set init room as current room
                    this.rooms.add(name);
                    this.room_inventories.push(new Inventory());
                    this.current_room = new Tag(type,name,conditionals,content,this.room_inventories.length-1);
                    tag_objects.push(this.current_room);
                } else if (type == "ROOM" && !this.rooms.has(name)) { //need to check if room already exists!-- use set
                    this.rooms.add(name);
                    this.room_inventories.push(new Inventory());
                    tag = new Tag(type,name,conditionals,content,this.room_inventories.length-1);
                } else if (type == "ROOM") { //second init issue 
                    for (var k=0; k<tag_objects.length; ++k) {
                        var current_tag = tag_objects[k];
                        if (current_tag.name == name) {
                            tag = new Tag(type,name,conditionals,content,current_tag.inventory_index); //should fix the room tag dependency issue
                            break;
                        }
                    }
                } else {
                    tag = new Tag(type,name,conditionals,content);
                }
                if (tag != undefined) {
                    tag_objects.push(tag);
                    //console.log("TAG_OBJECTS_PUSHED_TAG");
                }
                //console.log("NAME="+tag.name+"  CONTENT="+ content + "\n\n");
                ++j;
            }
            this.tags.push(tag_objects);
            ++i;
        }
    }
    findConditionals(string) { //use grouping to get rid of brackets in conditionals -- make sure is greedy
        var conditionals = [];
        //three inventories
        var player_cond = [];
        var room_cond = [];
        var global_cond = [];
        var i = 0;
        while (i < string.length) {
            switch(string[i]) {
                case "$":
                    player_cond.push(string.slice(i+1,string.indexOf("$",i+1)));
                    i = string.indexOf("$",i+1);
                    break;
                case "&":
                    room_cond.push(string.slice(i+1,string.indexOf("&",i+1)));
                    i = string.indexOf("&",i+1);
                    break;
                case "%":
                    global_cond.push(string.slice(i+1,string.indexOf("%",i+1)));
                    i = string.indexOf("%",i+1);
                    break;
                default:
                    break;
            }
            ++i;
        }
        conditionals.push(player_cond);
        conditionals.push(room_cond);
        conditionals.push(global_cond);
        return conditionals;
    }
    query(action, name) {
        console.log("running queury: "+action+" "+name);
        //get goal tag
        var tag_type = action.toUpperCase();
        var tag_type_index = TAGS.indexOf(tag_type);
        //console.log("TAG_TYPE="+tag_type+" TAG_TYPE_INDEX="+tag_type_index);
        var i = 0;
        var goal_tag = null;
        while (i < this.tags[tag_type_index].length) {
            //console.log("BEGIN FIRST WHILE="+i);
            var current_tag = this.tags[tag_type_index][i];
            //console.log(current_tag.content_sequence);
            //console.log("isVAlid="+current_tag.isValid(this.player_inventory,this.room_inventories[this.current_room.inventory_index], this.global_inventory));
            //console.log("CURRENT_ROOM="+this.current_room.inventory_index);
            if (current_tag.name == name && current_tag.isValid(this.player_inventory,this.room_inventories[this.current_room.inventory_index], this.global_inventory) && goal_tag == null) {
                goal_tag = current_tag;
            } else if (current_tag.name == name && current_tag.isValid(this.player_inventory,this.room_inventories[this.current_room.inventory_index], this.global_inventory) && current_tag.conditional_count > goal_tag.conditional_count) {
                goal_tag = current_tag;
            }
            ++i;
        }
        if (goal_tag == null) {
            console.warn("No matching tag found for query");
        } else {
            //add content tokens of goal_tag to action_queue
            //console.log("ACTION="+action);
            if (action == "ROOM") {
                this.current_room = goal_tag;
                //console.log("CHANGED ROOM TO="+goal_tag.name);
            }
            i = 0;
            while (i < goal_tag.content_sequence.length) {
                //console.log("CONTENT_SEQUENCE[i]="+goal_tag.content_sequence[i].string);
                this.action_queue.push(goal_tag.content_sequence[i]);
                ++i;
            }
        }
    }
    run() {
        this.action_queue.run();
    }
    
    interupt()
    {
        this.action_queue.interupt();
    }
}











