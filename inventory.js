class Inventory
{
    constructor()
    {
        this.items = new Set();
    }

    add(item)
    {
        this.items.add(item);
    }

    remove(item)
    {
        this.items.delete(item);
    }

    has(item)
    {
        /*
        console.log("Inventory:has");
        console.log(item);
        console.log(this);*/
        if(!item)
            return true;
        if(Array.isArray(item))
        {
            console.log("GOOD, NICE ITEM!!");
            console.log(item);
            for(var i = 0; i < item.length; ++i) {
                console.log("ITEM HAS SEARCH");
                console.log(this.items);
                if(!(this.items.has(item[i])))
                    return false;
            }
            return true;
        } else
        {
            console.log("NO ITEM WHY?");
            console.log(item);
            console.log(this.items.has(item));
            return this.items.has(item);
        }
    }
}
