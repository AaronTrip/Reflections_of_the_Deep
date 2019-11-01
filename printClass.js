class printClass{
   constructor(string,x,y,bwidth){
       //String input related
       //stringPointer and length are used to create array of letter objects and run through them
       //Counter is currently unused
       //Colour stores a color string to be used for a letter
       this.fullString = string;
       this.stringPointer = 0;
       this.counter = 0;
       this.color = '';
       this.length = 0;

       //Cases for deciding if a letter is regular, bold, italics or coloured
       this.case = 0;
       this.bold = false;
       this.italics = false;
       this.colorTest = false;

       //Output area
       //currentX and currentY are where the string starts printing
       //boxWidth is how far accross they can print
       //size is text size
       this.size = width/70;
       this.currentX = x;
       this.currentY = y;
       this.boxWidth = bwidth;

       //lettes is an array of letter objects to be printed
       this.letters = [];

       //Run through the entire length of the recieved string
       //Add each string character to its own letter object and append to letters
       for(var i = 0;i < this.fullString.length; i++){

            //Bold case check
            //call boldSet to check case
            //Increase charcter we are pointing to avoid adding # to printing list
            if(this.fullString[this.stringPointer] === '#'){
                this.boldSet();
                this.stringPointer++;
            }
            
            //Same as above except for italics case
            else if(this.fullString[this.stringPointer] === '~'){
                this.italSet();
                this.stringPointer++;
            }

            //Colour case goes here but not needed yet
            
            //Append letter to letters array
            //Increase stringPointer
            //Increase length
            //Length is used so that we know the actual array length since we dont add some characters ie #, ~
            this.letters[i] = new letter(this.fullString[this.stringPointer],'#ffffff',this.case);
            this.stringPointer++;
            this.length++;

            //
            if(this.stringPointer == this.fullString.length){
                break;
            }
       }
       //Reset string pointer to use again later if necessary
       this.stringPointer = 0;
    }

    //class print function loops, loops once it hits edges
    //goes through letters array and calls each objects print
    //Currently considers each functions bold and italics case
   oprint(){
       //Resets print location for call so we consistently print in the right place
       this.currentX = x;
       this.currentY = y;

       //Old code, used for printing chars one at a time on screen
       //May work?, not well if it does
       /*
        if(this.stringPointer < this.fullString.length && this.counter++ > 2){
            this.counter = 0;

            //Break test
            //Doesn't wait for player input
            //if(this.fullString[this.stringPointer] == '|'){
                //this.output += '\n \n';
                //this.stringPointer += 7;
            //}
            /*
            if(this.fullString[this.stringPointer] == '@'){
                color = '#';
                for(i = 3; i < 9; i++){
                    color += this.fullString[this.stringPointer + i];
                }
                this.colorSet(color);
            }
            
           
           var j;
           print(this.stringPointer + 's');
            for(j = 0; j < this.stringPointer; j++){
                print(j + 'j');
                this.letters[j].lprint();
            }
            this.stringPointer++;
        }
        */

        var j, k;
        for(j = 0; j < this.length; j++){
            
            if(this.currentX + (this.size) > this.boxWidth){
                if(j+1 < this.length && this.letters[j+1].getLetter() !== " "){
                    text('-',this.currentX, this.currentY,800);
                }
                this.currentX = x;
                this.currentY += 25;
            }
            this.letters[j].lprint(this.currentX,this.currentY);
            this.currentX += this.size;
        }
        
    }
    colorSet(color){
        if(this.colorTest == true){

            this.colorTest = false;
        }
        else{

            this.colorSet = true;
        }
    }
    boldSet(){
        if(this.bold == true){
            this.case = 0;
            this.bold = false;
        }
        else{
            this.case = 1;
            this.bold = true;
        }
    }
    italSet(){
        if(this.italics == true){
            this.case = 0;
            this.italics = false;
        }
        else{
            this.case = 2;
            this.italics = true;
        }
    }
}

class letter{
    constructor(string,color,typing){
        this.letter = string;
        this.color = color;
        this.typing = typing;
    }

    getLetter(){
        return this.letter;
    }

    lprint(x,y){
        if(this.typing == 0){
            textStyle(NORMAL);
        }
        else if(this.typing == 1){
            textStyle(BOLD);
        }
        else{
            textStyle(ITALIC);
        }
        //print(this.typing);
        text(this.letter, x, y, 800);
    }
}