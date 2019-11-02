class MainParser
{
	constructor(all_text,inventory)
	{
		this.all_text = all_text[0];
		this.inventory = inventory;
		console.log("constructor");
	}

	EXAMINE(object)
	{
		var x = 0;
		var upper_bound = 2;
		var counter = 1; //counts how many examines for the particular 

		console.log(this.all_text);
		for(x = 0; x < this.all_text.length; x++)
		{
			console.log('Head of for');
			var new_str = this.all_text[x].split(" ");

			if(new_str[0] == 'EXAMINE' && (new_str[1] == ("[" + object + "]") || new_str[1] == ("[" + object + "]:"))){
				console.log(this.all_text[x+3]);
				new_str2 = this.all_text[x + upper_bound].split(' ');
				console.log("fi");
				while(new_str2[0] == 'EXAMINE' && new_str2[1] == ("[" + object + "]") )
				{
					console.log("Head of while");
					counter += 1;
					upper_bound += 2;
					new_str2 = this.all_text[x + upper_bound].split(' ');
				}
				var counter1 = 0;
				while(counter1 != counter)
				{
					console.log('here');
					var s = '';
					var x2 = 2;
					counter1 += 1;
					new_str3 = this.all_text[x + upper_bound].split(' ');
					for(x2 = 2; x2 < new_str3.length; x2 ++)
					{
						var x3 = 1;
						for(x3 = 1; x3 < new_str3[x2].length; x3 ++)
						{
							if(new_str3[x2][x3] == '&'){
								break;
							}
							s += new_str3[x2][x3];
						}
						if(inventory.has(s))
						{
							continue;
						}
						else{
							break;
						}
					}


				}
				console.log(s);
			}
			console.log(x);
		}
		return s;
	}
}

