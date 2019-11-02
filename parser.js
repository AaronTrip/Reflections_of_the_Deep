const tok_type = {
    NULL:     0,
    PARENS:   1,
    INV_MOD:  2,
    TXT_MOD:  3,
    TAG:      4,
    STRING:   5
};

const TAGS = ["EXAMINE", "USE", "TALK", "GO", "TAKE", "ROOM", "BG", "YES", "NO"];
const TEXT_MODIFIERS = ["BREAK", "WAIT"];

// Defines a segment from of each of the major tags
class Segment
{
    constructor(type, name, conditions, body)
    {
        // All are arrays of tokens
        this.type = type;
        this.name = name;
        this.conditions = conditions;
        this.body = body;
    }
}

class Segments
{
    constructor()
    {
        this.segment = {};
    }

    addSegment(type, name, conditions, body)
    {
        if(type in this.segment)
            this.segment[type.string].push(new Segment(type, name, conditions, body));
        else
            this.segment[type.string] = [new Segment(type, name, conditions, body)];
    }

    // Type is the string of what type it is
    getSegment(type, name, player_inventory, local_inventory, global_inventory)
    {
        if(!(type in this.segment))
        {
            console.warn("Segment " + type.string + " does not exist");
            console.log(this.segment);
            return undefined;
        }
        var segments = this.segment[type];
        segments.sort(function(a, b)
                      {
                          if(b.conditions.length < a.conditions.length)
                              return -1;
                          if(a.conditions.length < b.conditions.length)
                              return 1;
                          return 0;
                      });
        for(var i = 0; i < segments.length; ++i)
        {
            console.log(segments[i]);
            console.log(player_inventory);
            console.log(local_inventory);
            if((segments[i].conditions[0] === [] || player_inventory.has(segments[i].conditions[0])) &&
               (segments[i].conditions[1] === [] || local_inventory.has(segments[i].conditions[1])) &&
               (segments[i].conditions[2] === [] || global_inventory.has(segments[i].conditions[2])))
            {
                console.log(segments[i]);
                return segments[i];
            }
        }

        console.warn("Could not find the segment " + type + " [" + name + "]");
        return undefined;
    }
}

class Room
{
    constructor(name, tokens, conditionals)
    {
        this.name = name;
        this.tokens = tokens;
        this.conditionals = conditionals;
        this.inventory = new Inventory();
        this.segments = new Segments();
        this.run_dialogue;
        this.run_index;

        this.draw_string = undefined;
    }

    getSegment(type, name, player_inventory, global_inventory)
    {
        return this.segments.getSegment(type, name, player_inventory, this.inventory, global_inventory);
    }

    run(player_inventory, global_inventory)
    {
        var segment = this.segments.getSegment("ROOM", this.name, player_inventory, this.inventory, global_inventory);

        if(segment === undefined)
        {
            console.warn("Could not find the segment to run the room");
            return;
        }

        this.run_dialogue = segment.body;
        this.run_index = 0;

        this.next(player_inventory, global_inventory);
    }

    next(player_inventory, global_inventory)
    {
        console.log("Running next itteration");
        if(this.run_index < this.run_dialogue.length)
        {
            if(this.run_dialogue[this.run_index].type == tok_type.STRING)
            {
                console.log("Found a string");
                console.log(this.run_dialogue[this.run_index].string);
                this.draw_string = new printClass(this.run_dialogue[this.run_index].string, -400, -250, 800);
                ++this.run_index;
            }
            else if(this.run_dialogue[this.run_index][0].string == "^")
            {
                // Handle inventory managment;
                console.log("ADD/REMOVE from inventory");
                switch(this.run_dialogue[this.run_index][1].string)
                {
                    case "+":
                    player_inventory.add(this.run_dialogue[this.run_index][2]);
                    break;

                    case "++":
                    this.inventory.add(this.run_dialogue[this.run_index][2]);
                    console.log("GOOD");
                    console.log(this.inventory);
                    break;

                    case "+++":
                    global_inventory.add(this.run_dialogue[this.run_index][2]);
                    break;

                    case "-":
                    player_inventory.remove(this.run_dialogue[this.run_index][2]);
                    break;

                    case "--":
                    this.inventory.remove(this.run_dialogue[this.run_index][2]);
                    break;

                    case "---":
                    global_inventory.remove(this.run_dialogue[this.run_index][2]);
                    break;

                    defualt:
                    console.warn("Reading in something odd in Room:next:pickup/dropoff");
                }
                ++this.run_index;
            } else if (this.run_dialogue[this.run_index][0].string == "|")
            {
                // TODO Handle waits
                // Skipping
                console.log("NEED TO WWAIT");
                ++this.run_index;
            } else if (this.run_dialogue[this.run_index][0].string == "*")
            {
                // TODO handle sound
                // Skipping
                console.log("NEED TO PLAY SOUND");
                ++this.run_index;
            } else if (this.run_dialogue[this.run_index][0].string == "<")
            {
                // TODO handle bg music
                // Skipping
                ++this.run_index;
                console.log("Need to add bg music");
            } else if (this.run_dialogue[this.run_index][0].string == "[[")
            {
                var tmp = this.run_dialogue[this.run_index][1].string;
                console.log("Moving to new state");
                ++this.run_index;
                return tmp;
            } else
            {
                console.log("Damnit");
                console.log(this.run_dialogue[this.run_index]);
            }
        } else
        {
            console.log("Too Long");
            
        }
    }

    draw()
    {
        if(this.draw_string !== undefined)
        {
            this.draw_string.oprint();
        }
    }
}

class Rooms
{
    constructor()
    {
        this.room = {};
        this.current_room;
    }

    addRoom(room_name, tokens, conditionals)
    {
        if(room_name in this.room)
            this.room[room_name].push(new Room(room_name, tokens, conditionals));
        else
            this.room[room_name] = [new Room(room_name, tokens, conditionals)];
    }

    getRoom(room_name, player_inventory, global_inventory)
    {
        if(!(room_name in this.room))
        {
            // Try to keep running in event of error
            console.warn("Unknown room: " + room_name + "!");
            for(var key in this.room)
            {
                if(Array.isArray(this.room[key]))
                    return this.room[key][0];
                return this.room[key];
            }
        }
        var rooms = this.room[room_name];
        rooms.sort(function(a, b)
                   {
                       if(b.conditionals.length < a.conditionals.length)
                           return -1;
                       if(a.conditionals.length < b.conditionals.length)
                           return 1;
                       return 0;
                   });
        for(var i = 0; i < rooms.length; ++i)
        {
            // Check to see if the which conditionals are met by the inventories
            if(player_inventory.has(rooms[i].conditionals[0]) || rooms[i].inventory.has(rooms[i].conditionals[1]) ||
               global_inventory.has(rooms[i].conditionals[2]))
            {
                return rooms[i];
            }
        }

        // Try to keep running in the event of an error
        console.warn("Conditionals not met for any room!");
        return rooms[rooms.length-1];
    }
}

// The atomic unit of our language
class Token
{
    constructor(string, type)
    {
        this.string = string;
        this.type = type;
    }
}

// Parses the given corpus and provides the ability to query the data
class Parser
{
    constructor(corpus, player_inventory, global_inventory)
    {
        console.log(corpus);
        this.corpus = corpus;
        this.player_inventory = player_inventory;
        this.global_inventory = global_inventory;
        this.index = 0;
        this.token = new Token("", tok_type.NULL);
        this.tokens = [];
        this.rooms = new Rooms();
    }

    // Seperate corpus into atomic chunks
    tokenize()
    {
        while(this.index < this.corpus.length)
        {
            var current_char = this.corpus[this.index];

            switch(current_char)
            {
                // Coalesce double characters
                case "[": case "]": case "+": case "-":  // Can occur in doubles and triples
                case "&": case "|":  // For possible future functionality of logical operators
                // Bounds checking
                if(this.tokens.length > 0)
                {
                    var past_tok = this.token;
                    if(this.token.type == tok_type.NULL)
                        past_tok = this.tokens[this.tokens.length-1];

                    if(past_tok.string !== "" && past_tok.string[0] == current_char)
                    {
                        past_tok.string += current_char;
                        break;
                    }
                }

                // Handle pushing new tokens
                default:
                switch(current_char)
                {
                    // Parentheses
                    case "[": case "]": case "{": case "}":
                    case "<": case ">": case "$": case "&":
                    case "^": case "%": case "|": case "*":
                    if(this.token.string)
                        this.tokens.push(this.token);
                    this.tokens.push(new Token(current_char, tok_type.PARENS));
                    this.token = "";
                    this.token = new Token("", tok_type.NULL);
                    break;

                    // Modifiers
                    case "+": case "-":
                    if(this.token.string)
                        this.tokens.push(this.token);
                    this.tokens.push(new Token(current_char, tok_type.INV_MOD));
                    this.token = new Token("", tok_type.NULL);


                    // White-space
                    case " ": case "\t": case "\n":
                    if(this.token.string)
                        this.tokens.push(this.token);
                    this.token = new Token("", tok_type.NULL);
                    break;

                    // Everything else will be assumed to be a string
                    default:
                    this.token.string += current_char;
                    this.token.type = tok_type.STRING;
                }
            }

            // Go to the next value
            ++this.index;
        }
        // Empty any possible token
        if(this.token)
            this.tokens.push(new Token(this.token));
        this.token = "";

        // Reset index
        this.index = 0;

        // Next steps
        this.findTags();
        this.coaleaseStrings();
        this.splitRooms();
        this.splitSegments();
        this.printRooms();
    }

    printTokens()
    {
        console.log(this.tokens);
    }

    // Quickly go through and make note of the special strings (the tags)
    findTags()
    {
        while(this.index < this.tokens.length)
        {
            var tok = this.tokens[this.index];
            if(tok.type == tok_type.STRING)
            {
                // Action Tag
                if(TAGS.indexOf(tok.string) >= 0)
                    this.tokens[this.index].type = tok_type.TAG;
                // In text tag
                else if(TEXT_MODIFIERS.indexOf(tok.string) >= 0)
                    this.tokens[this.index].type = tok_type.INV_MOD;
            }

            ++this.index;
        }

        this.index = 0;
    }

    // Groups together all adjacent STRINGs into a larger token
    coaleaseStrings()
    {
        var new_tokens_list = [];

        this.index = 0;
        // Copy over the first element
        if(this.index < this.tokens.length)
            new_tokens_list.push(new Token(this.tokens[this.index].string, this.tokens[this.index].type));
        ++this.index;

        while(this.index < this.tokens.length)
        {
            var tok1 = new_tokens_list[new_tokens_list.length-1];
            var tok2 = this.tokens[this.index];
            if(tok1.type == tok_type.STRING && tok2.type == tok_type.STRING)
            {
                // Merge the two strings
                new_tokens_list[new_tokens_list.length-1].string += " " + tok2.string;
            } else
            {
                // Otherwise just copy the token over
                new_tokens_list.push(new Token(tok2.string, tok2.type));
            }
            ++this.index;
        }

        this.index = 0;
        this.tokens = new_tokens_list;
    }

    // Returns the nearest name defined by [name] from the start index passed
    findNearestName(tokens, start)
    {
        var i = 0;
        var flag = true;
        var return_toks = [];
        while(start+i < tokens.length && flag)
        {
            // Search for '['
            if(tokens[start+i].string == "[")
            {
                while(start+(++i) < tokens.length)
                {
                    if(tokens[start+i].string == "]")
                    {
                        // End when we hit the closing bracket
                        flag = false;
                        break;
                    } else
                    {
                        // Error checking
                        if(tokens[start+i].type != tok_type.STRING)
                            console.warn("Name identifier formatted incorrectly");

                        // Copy token to return buffer
                        return_toks.push(new Token(tokens[start+i].string, tokens[start+i].type));
                    }
                }
            }

            ++i;
        }
        if(return_toks.length != 1)
            console.warn("Name identifier formatted incorrectly");

        return return_toks[0].string;
    }

    // Finds all of the nearby conditionals and returns an array with
    // [player_conditionals, local_meta_conditionals, global_meta_conditionals]
    // where each one is a list of strings
    findNearestConditionals(tokens, start)
    {
        var player_conditionals = [];
        var local_conditionals = [];
        var global_conditionals = [];
        while(start < tokens.length)
        {
            var token = tokens[start];
            ++start;

            // No point looking further if it is not a parens
            if(token.type != tok_type.PARENS)
                continue;

            // Otherwise token type is PARENS
            switch(token.string)
            {
                case "$":  // Player inventory
                case "&":  // Local meta inventory
                case "%":  // Global meta inventory
                // Figure out what to add to the inventories
                var conditionals_count = 0;
                while(start < tokens.length)
                {
                    // Check for token to append
                    if(tokens[start].type == tok_type.STRING)
                    {
                        // Error checking and handling
                        ++conditionals_count;
                        if(conditionals_count > 1)
                            console.warn(token.string + " Conditional formatted incorrectly: " + tokens[start].string);

                        // Add to return arrays
                        switch(token.string)
                        {
                            case "$":
                            player_conditionals.push(tokens[start].string);
                            break;

                            case "&":
                            local_conditionals.push(tokens[start].string);
                            break;

                            case "%":
                            global_conditionals.push(tokens[start].string);
                            break;

                            default:
                            console.warn("You should never see this (Parser:findNearestConditionals:switch_statment)");
                        }
                    }
                    // Otherwise see of it is the delimiting token
                    else if(tokens[start].string == token.string)
                    {
                        // Error checking code
                        if(conditionals_count < 1)
                            console.warn("findNearestConditionals could not find any conditionals in parens for " + token.string);

                        break;
                    }
                    ++start;
                }
                ++start;
                break;

                case "{":  // We have gone past the conditions into the body
                return [player_conditionals, local_conditionals, global_conditionals];
                break;

                defualt:
                // Not much else to do but try again
                break;
            }
        }

        return [player_conditionals, local_conditionals, global_conditionals];
    }

    splitRooms()
    {
        // Markers for the start and end of a room
        var start = this.index;
        var end = this.index;

        while(this.index < this.tokens.length)
        {
            // Check if we found a room
            if(this.tokens[this.index].string == "ROOM")
            {
                start = this.index;
                var room_tokens = [this.tokens[this.index]];
                var room_name = this.findNearestName(this.tokens, start);
                var room_conditionals = this.findNearestConditionals(this.tokens, start);

                ++this.index;
                // Spin until we find the next room or the EOF
                while(this.index <this.tokens.length)
                {
                    if(this.tokens[this.index].string == "ROOM")
                    {
                        end = this.index - 1;
                        break;
                    }
                    // Grab any token that is not the next "ROOM" token
                    room_tokens.push(this.tokens[this.index]);
                    ++this.index;
                }

                // Now that we know the name, tokens, and conditionals make a room
                this.rooms.addRoom(room_name, room_tokens, room_conditionals);

            } else
            {
                // Otherwise just continue on
                ++this.index;
            }

        }
        this.index = 0;
    }


    splitSegments()
    {
        console.log("Spliting segments");
        for(var key in this.rooms.room)
        {
            for(var i = 0; i < this.rooms.room[key].length; ++i)
            {
                var index = 0;
                var room = this.rooms.room[key][i];
                                // Find the head
                while(index < room.tokens.length)
                {
                    var start = 0;
                    var type;
                    var name;
                    var conditions = [];
                    var body = [];

                    if(room.tokens[index].type != tok_type.TAG)
                    {
                        console.warn("Token " + room.tokens[index].type + " before tag: " + room.tokens[index].string);
                        ++index;
                        continue;
                    }

                    // Fill out most of the data
                    type = room.tokens[index];
                    start = index;
                    name = this.findNearestName(room.tokens, index);
                    start = index;
                    conditions = this.findNearestConditionals(room.tokens, index);

                    console.log("Found a " + type + " segment");

                    // Find the body
                    while(index < room.tokens.length)
                    {
                        if(room.tokens[index].string != "{")
                        {
                            ++index;
                            continue;
                        }

                        // Go past '{'
                        ++index;
                        while(index < room.tokens.length)
                        {
                            var tok = room.tokens[index];
                            var tok_str = tok.string;
                            if(tok.string == "}")
                            {
                                break;
                            }

                            switch(tok.type)
                            {
                                case tok_type.STRING:
                                body.push(tok);
                                break;

                                case tok_type.PARENS:
                                var complex_tok = [tok];
                                while(++index < room.tokens.length)
                                {
                                    complex_tok.push(room.tokens[index]);
                                    if(room.tokens[index].type == tok_type.PARENS)
                                    {
                                        break;
                                    }
                                }
                                body.push(complex_tok);
                                break;

                                defualt:
                                console.warn("You should not be here (Parser:splitSegments:switch)");
                            }
                            ++index;
                        }

                        // Move past '}'
                        ++index;
                        room.segments.addSegment(type, name, conditions, body);
                        console.log(room);
                        break;
                    }
                }
            }
        }
    }

    printRooms()
    {
        console.log(this.rooms);
    }

    query(action, name)
    {
        switch(action)
        {
            case "EXAMINE":
            var out = this.rooms.current_room.getSegment("EXAMINE", name, this.player_inventory, this.global_inventory);
            if(out === undefined)
            {
                console.warn("NO NO");
            }
            console.log(out);
            break;

            case "USE":
            var out = this.rooms.current_room.getSegment("USE", name, this.player_inventory, this.global_inventory);
            break;

            case "TALK":
            var out = this.rooms.current_room.getSegment("TALK", name, this.player_inventory, this.global_inventory);
            break;

            case "GO":
            var out = this.rooms.current_room.getSegment("GO", name, this.player_inventory, this.global_inventory);
            console.log(out);
            if(out)
                this.rooms.current_room = this.rooms.getRoom(out, this.player_inventory, this.global_inventory);
            break;

            case "TAKE":
            var out = this.rooms.current_room.getSegment("TAKE", name, this.player_inventory, this.global_inventory);
            break;

            case "HELP":
            var out = this.rooms.current_room.getSegment("HELP", name, this.player_inventory, this.global_inventorye);
            break;

            case "INVENTORY":
            var out = this.rooms.current_room.getSegment("INVENTORY", name, this.player_inventory, this.global_inventorye);
            break;

            case "YES":
            var out = this.rooms.current_room.getSegment("YES", name, this.player_inventory, this.global_inventory);
            if(out)
                this.rooms.current_room = this.rooms.getRoom(out, this.player_inventory, this.global_inventory);
            break;

            case "NO":
            var out = this.rooms.current_room.getSegment("NO", name, this.player_inventory, this.global_inventory);
            if(out)
                this.rooms.current_room = this.rooms.getRoom(out, this.player_inventory, this.global_inventory);
            break;

            default:

        }
    }
}
