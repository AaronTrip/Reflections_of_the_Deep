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
        if(item === [])
            return true;
        if(Array.isArray(item))
        {
            for(var i = 0; i < item.length; ++i)
                if(!this.items.has(item[i]))
                    return false;
            return true;
        } else
        {
            return this.items.has(item);
        }
    }
}
