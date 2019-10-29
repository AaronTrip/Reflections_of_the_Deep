class printClass{
    //Output is string being updated and printed
    //fullString is end string to be printed
    //stringPointer is used to update how much string to be printed
    //counter affects string print speed
   constructor(string){
       this.fullString = string;
       this.stringPointer = 0;
       this.counter = 0;
       this.color = '';
       this.case = 0;
       this.bold = false;
       this.italics = false;
       this.colorTest = false;
       this.size = width/70;
       this.length = 0;
       this.currentX = -400;
       this.currentY = -250;

       this.letters = [];
       for(var i = 0;i < this.fullString.length; i++){
            if(this.fullString[this.stringPointer] === '#'){
                this.boldSet();
                this.stringPointer++;
            }
            else if(this.fullString[this.stringPointer] === '~'){
                this.italSet();
                this.stringPointer++;
            }
            
            this.letters[i] = new letter(this.fullString[this.stringPointer],'#ffffff',this.case);
            this.stringPointer++;
            this.length++;

            if(this.stringPointer == this.fullString.length){
                break;
            }
       }
       this.stringPointer = 0;
    }

    //class print function loops, loops once it hits edges
    //For test cases can read and implement breaks
    //Will update with reading of color, bold and italics soon
   oprint(){
       this.currentX = -400;
       this.currentY = -250;
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
            if(this.currentX + (this.size) > 400){
                if(j+1 < this.length && this.letters[j+1].getLetter() !== " "){
                    text('-',this.currentX, this.currentY,800);
                }
                this.currentX = -400;
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