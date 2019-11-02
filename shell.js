class Shell
{
    constructor(canvas_width, canvas_height, font, text_size)
    {
        this.shell_line = "> ";
        this.width = canvas_width;
        this.height = canvas_height;
        this.font = font;
        this.text_size = text_size;
        this.command_ready = false;
        this.continue = false;
    }

    // Grabs character when a key is pressed
    keyTyped()
    {
        //      Space                     Digits                           Upper-Case                       Lower-Case
        if((keyCode == 32) || (keyCode > 47 && keyCode < 58) || (keyCode > 64 && keyCode < 91) || (keyCode > 96 && keyCode < 123))
        {
            this.shell_line += key;
        } else
        {
            switch(keyCode)
            {
                case BACKSPACE:  // Backspace
                if(this.shell_line.length > 2)
                    this.shell_line = this.shell_line.slice(0, this.shell_line.length - 1);
                break;

                case RETURN: // Newline
                console.log("Enter pressed");
                this.command_ready = true;
                break;

                case DELETE:
                this.continue = true; 
                console.log("RIGHT");
                break;

                default:
                // Pass
                console.log("Unhandled key pressed " + keyCode.toString());
            }
        }
    }

    commandReady()
    {
        return this.command_ready;
    }

    getCommand()
    {
        return this.shell_line.slice(2, this.shell_line.length).toLowerCase().split(' ');
    }

    // Draws the line
    draw()
    {
        push();
        text(this.shell_line, (-this.width/2) + 100, (this.height / 2) - 50);//10, this.height - 50);
        pop();
    }


}
