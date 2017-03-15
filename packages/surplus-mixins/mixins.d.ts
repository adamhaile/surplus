interface SurplusMixins {
	data(data : (v? : any) => any, event? : string) : SurplusMixin;
	focus(flag : Boolean, start? : number, end? : number) : SurplusMixin;
	onkey : {
		(key : string, callback : (key : KeyboardEvent) => void) : SurplusMixin;
		(key : string, event : string, callback : (key : KeyboardEvent) => void) : SurplusMixin;
	};
	class : {
		(name : string, flag : Boolean) : SurplusMixin;
		(name : string, alternate : string, flag : Boolean) : SurplusMixin;
	};
}