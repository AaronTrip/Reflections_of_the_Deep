class stringTyper{
    //Output is string being updated and printed
    //fullString is end string to be printed
    //stringPointer is used to update how much string to be printed
    //counter affects string print speed
   constructor(string){
       this.fullString = string;
       this.output = "";
       this.stringPointer = 0;
       this.counter = 0;
    }

    //class print function loops, loops once it hits edges
    //For test cases can read and implement breaks
    //Will update with reading of color, bold and italics soon
   oprint(){
        text(this.output,-400,-250,800);
        if(this.stringPointer < this.fullString.length && this.counter++ > 2){
            //this.counter = 0;
            if(this.fullString[this.stringPointer] == '|'){
                this.output += '\n \n';
                this.stringPointer += 7;
            }
            else{
                this.output += this.fullString[this.stringPointer++];
            }
        }
    }
    colorSet(){

    }
    boldSet(){

    }
    italSet(){

    }
}