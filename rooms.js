class Rooms
{
    constructor(narrative)
    {
        this.txt = narrative;
        this.room = {};
        this.inventory = {};
    }

    getRoom(name)
    {
        if(name in this.room)
            return this.room[name];
        else
            return false;
    }

    getInventory(name)
    {
        if(name in this.inventory)
            return this.inventory[name];
        else
            return false;
    }

    parse()
    {
        var lower_bound = 0;
        var flag = 0;
        var checker = 0;
        for(lower_bound = 0; lower_bound <= this.txt.length; ++lower_bound)
        {

            // Check for EOF
            if(!this.txt[lower_bound])
                continue;

            var new_str = this.txt[lower_bound].split(' ');
            if (new_str[0] == 'ROOM' && (new_str[1][0] == ('[' )))
            {
                var it = 0;
                var room_name = "";

                while(new_str[1][++it] != ']')
                {
                    room_name += new_str[1][it];
                }
                let upper_bound = 0;
                upper_bound = lower_bound + 1;
                var new_str2 = this.txt[upper_bound].split(' ');

                while (new_str2[0] != 'ROOM' && upper_bound != this.txt.length-1)
                {
                    ++checker;
                    new_str2 = this.txt[++upper_bound].split(' ');
                }
                console.log("New room found: " + room_name);
                if(!(room_name in this.room))
                {
                    this.room[room_name] = [this.txt.slice(lower_bound, upper_bound)];
                    this.inventory[room_name] = [new Inventory()];
                } else
                {
                    this.room[room_name].push(this.txt.slice(lower_bound, upper_bound));
                    this.inventory[room_name].push(new Inventory());
                }
                lower_bound = upper_bound-1;

            }
        }
        console.log("End of rooms parse");
        return checker;
    }
}
